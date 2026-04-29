import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Employee, EmployeeDocument } from '../employees/schemas/employee.schema';
import { Skill, SkillDocument } from '../skills/schemas/skill.schema';

interface EmployeeMatch {
  employeeId: string;
  employeeName: string;
  department: string;
  score: number;
  matchedSkills: { skill: string; rating: number }[];
  missingSkills: string[];
  isFromOtherDepartment: boolean;
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly apiKey = 'AIzaSyC4oE1DtBXXy_tteE-Hz7W4rDnE1CUru1k';
  private readonly apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

  constructor(
    @InjectModel(Employee.name)
    private readonly employeeModel: Model<EmployeeDocument>,
    @InjectModel(Skill.name)
    private readonly skillModel: Model<SkillDocument>,
  ) {}

  /**
   * Generate common variations of skill names for flexible matching
   */
  private generateSkillVariations(skillName: string): string[] {
    const variations = new Set<string>();
    const lower = skillName.toLowerCase();

    // Add original
    variations.add(lower);

    // Add without spaces/dots
    variations.add(lower.replace(/[.\s]/g, ''));

    // Add with js suffix for common technologies
    if (!lower.includes('.js') && !lower.includes('js')) {
      variations.add(`${lower}js`);
      variations.add(`${lower}.js`);
    }

    // Add dot prefix versions
    if (!lower.startsWith('.')) {
      variations.add(`.${lower}`);
    }

    return Array.from(variations);
  }

  /**
   * Fallback skill extraction when Gemini fails
   */
  private async fallbackSkillExtraction(text: string): Promise<string[]> {
    this.logger.log(`[FALLBACK] Extracting from: "${text}"`);

    try {
      const allSkills = await this.skillModel.find().select('name').lean();
      this.logger.log(`[FALLBACK] Found ${allSkills.length} skills in DB`);

      if (allSkills.length === 0) {
        this.logger.warn(`[FALLBACK] No skills found in database!`);
        return [];
      }

      const textLower = text.toLowerCase();
      const foundSkills: string[] = [];

      for (const skill of allSkills) {
        const skillNameLower = skill.name.toLowerCase().trim();

        // Direct substring match
        if (textLower.includes(skillNameLower)) {
          foundSkills.push(skill.name);
          this.logger.log(`[FALLBACK] ✓ Direct match: "${skill.name}"`);
          continue;
        }

        // Try variations
        const variations = this.generateSkillVariations(skillNameLower);
        for (const variation of variations) {
          if (textLower.includes(variation)) {
            foundSkills.push(skill.name);
            this.logger.log(`[FALLBACK] ✓ Match via variation: "${skill.name}" (via "${variation}")`);
            break;
          }
        }
      }

      this.logger.log(`[FALLBACK] Total skills found: ${foundSkills.length}: [${foundSkills.join(', ')}]`);
      return foundSkills;
    } catch (error) {
      this.logger.error(`[FALLBACK] Error: ${error}`);
      return [];
    }
  }

  /**
   * Extract required skills from natural language text using Gemini with fallback
   */
  async extractSkills(text: string): Promise<string[]> {
    this.logger.log(`Extracting skills from: "${text}"`);

    const prompt = `Analyze this text and extract only the technical skills or job roles mentioned. Return ONLY a comma-separated list of skill names. Do not include explanations.

Text: "${text}"

Skills (comma-separated only):`;

    try {
      const response = await this.callGemini(prompt);
      this.logger.log(`Gemini response: "${response}"`);

      const skills = response
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && s.toLowerCase() !== 'none' && !s.toLowerCase().includes('no skills'));

      this.logger.log(`Extracted ${skills.length} skills via Gemini: [${skills.join(', ')}]`);

      if (skills.length === 0) {
        this.logger.log(`Gemini returned no skills, trying fallback...`);
        return this.fallbackSkillExtraction(text);
      }

      return skills;
    } catch (error) {
      this.logger.error(`Gemini failed: ${error}, trying fallback...`);
      return this.fallbackSkillExtraction(text);
    }
  }

  /**
   * Call Gemini API with logging
   */
  async callGemini(prompt: string): Promise<string> {
    this.logger.log(`Calling Gemini API...`);

    try {
      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });

      this.logger.log(`Gemini API status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Gemini API error: ${response.status} - ${errorText}`);
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      this.logger.log(`Gemini returned: "${text}"`);

      return text;
    } catch (error) {
      this.logger.error(`Gemini API call failed: ${error}`);
      throw error;
    }
  }

  /**
   * Get all skills with variations for flexible matching
   */
  private async getAllSkillsWithAssignments(): Promise<Map<string, Map<string, number>>> {
    const skills = await this.skillModel.find().lean();
    const skillMap = new Map<string, Map<string, number>>();

    for (const skill of skills) {
      const assignments = skill.assignments || [];
      const employeeRatings = new Map<string, number>();
      for (const assignment of assignments) {
        employeeRatings.set(assignment.employeeId.toString(), assignment.level);
      }

      const originalLower = skill.name.toLowerCase().trim();
      skillMap.set(originalLower, employeeRatings);

      const normalized = originalLower.replace(/[^a-z0-9]/g, '');
      if (normalized !== originalLower) {
        skillMap.set(normalized, employeeRatings);
      }

      // Store variations
      const variations = this.generateSkillVariations(originalLower);
      for (const variation of variations) {
        if (!skillMap.has(variation)) {
          skillMap.set(variation, employeeRatings);
        }
      }
    }

    this.logger.log(`Loaded ${skillMap.size} skill mappings from ${skills.length} skills`);
    return skillMap;
  }

  /**
   * Calculate employee match score with detailed logging
   */
  private calculateEmployeeMatch(
    employee: any,
    requiredSkills: string[],
    skillMap: Map<string, Map<string, number>>,
    isFromOtherDept: boolean,
  ): EmployeeMatch | null {
    const employeeId = employee._id.toString();
    const employeeName = employee.fullName;

    this.logger.log(`[CALC] Checking ${employeeName} (${employeeId}) against [${requiredSkills.join(', ')}]`);

    const matchedSkills: { skill: string; rating: number }[] = [];
    const missingSkills: string[] = [];
    let totalScore = 0;
    let maxPossibleScore = 0;

    for (const requiredSkill of requiredSkills) {
      const skillLower = requiredSkill.toLowerCase().trim();
      const skillNormalized = skillLower.replace(/[^a-z0-9]/g, '');
      const variations = this.generateSkillVariations(skillLower);
      const allKeys = [skillLower, skillNormalized, ...variations];

      let employeeRating = 0;
      let matchedKey = '';

      for (const key of allKeys) {
        if (skillMap.has(key)) {
          const rating = skillMap.get(key)?.get(employeeId) || 0;
          if (rating > 0) {
            employeeRating = rating;
            matchedKey = key;
            break;
          }
        }
      }

      if (employeeRating > 0) {
        matchedSkills.push({ skill: requiredSkill, rating: employeeRating });
        totalScore += employeeRating;
        this.logger.log(`[CALC]   ✓ Matched "${requiredSkill}" (via "${matchedKey}") rating ${employeeRating}`);
      } else {
        missingSkills.push(requiredSkill);
        this.logger.log(`[CALC]   ✗ Missing "${requiredSkill}"`);
      }
      maxPossibleScore += 5;
    }

    const score = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;
    this.logger.log(`[CALC] ${employeeName} score: ${score}% (${matchedSkills.length}/${requiredSkills.length} skills)`);

    if (score === 0) return null;

    return {
      employeeId,
      employeeName,
      department: employee.department || 'Unknown',
      score,
      matchedSkills,
      missingSkills,
      isFromOtherDepartment: isFromOtherDept,
    };
  }

  /**
   * Find matching employees - Two-phase search: local then global
   */
  async findMatchingEmployees(managerDepartment: string, description: string): Promise<EmployeeMatch[]> {
    this.logger.log(`[MATCH] Starting search for dept: "${managerDepartment}", desc: "${description}"`);

    const requiredSkills = await this.extractSkills(description);
    this.logger.log(`[MATCH] Extracted skills: [${requiredSkills.join(', ')}]`);

    if (requiredSkills.length === 0) {
      this.logger.warn(`[MATCH] No skills extracted, returning empty`);
      return [];
    }

    const skillMap = await this.getAllSkillsWithAssignments();
    const deptNormalized = managerDepartment?.trim().toLowerCase();

    // Phase 1: Search in manager's department
    let localEmployees: any[] = [];
    if (deptNormalized) {
      localEmployees = await this.employeeModel
        .find({ department: { $regex: new RegExp(deptNormalized, 'i') } })
        .lean();
      this.logger.log(`[MATCH] Found ${localEmployees.length} employees in department "${managerDepartment}"`);
    }

    // Calculate local matches
    let matches: EmployeeMatch[] = [];
    for (const emp of localEmployees) {
      const match = this.calculateEmployeeMatch(emp, requiredSkills, skillMap, false);
      if (match) {
        matches.push(match);
        this.logger.log(`[MATCH] ✓ Local match: ${match.employeeName} (${match.score}%)`);
      }
    }

    this.logger.log(`[MATCH] Found ${matches.length} local employees with matching skills`);

    // Phase 2: If no local matches with skills, search globally
    if (matches.length === 0) {
      this.logger.log(`[MATCH] No local matches with skills, searching globally...`);
      const allEmployees = await this.employeeModel.find().lean();
      this.logger.log(`[MATCH] Found ${allEmployees.length} employees total`);

      for (const emp of allEmployees) {
        const match = this.calculateEmployeeMatch(emp, requiredSkills, skillMap, true);
        if (match) {
          matches.push(match);
          this.logger.log(`[MATCH] ✓ Global match: ${match.employeeName} (${match.score}%, dept: ${match.department})`);
        }
      }

      this.logger.log(`[MATCH] Found ${matches.length} matching employees across all departments`);
    }

    const sortedMatches = matches.sort((a, b) => b.score - a.score);
    this.logger.log(`[MATCH] Returning ${sortedMatches.length} sorted recommendations`);
    return sortedMatches;
  }
}


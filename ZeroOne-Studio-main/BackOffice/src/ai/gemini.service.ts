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
   * Extract required skills from natural language text using Gemini
   */
  private async extractSkills(text: string): Promise<string[]> {
    const prompt = `Analyze this text and extract only the technical skills or job roles mentioned. Return ONLY a comma-separated list of skill names. Do not include explanations.

Text: "${text}"

Skills (comma-separated only):`;

    try {
      const response = await this.callGemini(prompt);
      const skills = response
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      return skills;
    } catch (error) {
      this.logger.error(`Failed to extract skills: ${error}`);
      return [];
    }
  }

  /**
   * Call Gemini API
   */
  private async callGemini(prompt: string): Promise<string> {
    const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.candidates[0]?.content?.parts[0]?.text || '';
  }

  /**
   * Get all skills with their assignments for matching
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
    }

    this.logger.log(`Loaded ${skillMap.size} skill mappings`);
    return skillMap;
  }

  /**
   * Find matching employees based on required skills and manager's department
   */
  async findMatchingEmployees(managerDepartment: string, description: string): Promise<EmployeeMatch[]> {
    const requiredSkills = await this.extractSkills(description);
    this.logger.log(`Extracted skills: ${requiredSkills.join(', ')}`);

    if (requiredSkills.length === 0) {
      return [];
    }

    const employees = await this.employeeModel
      .find({ department: managerDepartment })
      .lean();

    if (employees.length === 0) {
      return [];
    }

    this.logger.log(`Found ${employees.length} employees in department ${managerDepartment}`);

    const skillMap = await this.getAllSkillsWithAssignments();

    const matches: EmployeeMatch[] = employees.map((employee) => {
      const matchedSkills: { skill: string; rating: number }[] = [];
      const missingSkills: string[] = [];
      let totalScore = 0;
      let maxPossibleScore = 0;

      for (const requiredSkill of requiredSkills) {
        const skillLower = requiredSkill.toLowerCase().trim();
        const skillNormalized = skillLower.replace(/[^a-z0-9]/g, '');

        let employeeRating = 0;

        if (skillMap.has(skillLower)) {
          employeeRating = skillMap.get(skillLower)?.get(employee._id.toString()) || 0;
        }

        if (employeeRating === 0 && skillMap.has(skillNormalized)) {
          employeeRating = skillMap.get(skillNormalized)?.get(employee._id.toString()) || 0;
        }

        if (employeeRating > 0) {
          matchedSkills.push({
            skill: requiredSkill,
            rating: employeeRating,
          });
          totalScore += employeeRating;
        } else {
          missingSkills.push(requiredSkill);
        }
        maxPossibleScore += 5;
      }

      const score = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;

      return {
        employeeId: employee._id.toString(),
        employeeName: employee.fullName,
        department: employee.department || '',
        score,
        matchedSkills,
        missingSkills,
        isFromOtherDepartment: false,
      };
    });

    return matches
      .filter((m) => m.score > 0)
      .sort((a, b) => b.score - a.score);
  }
}


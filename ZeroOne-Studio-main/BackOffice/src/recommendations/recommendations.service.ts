import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Activity, ActivityDocument } from '../activities/schemas/activity.schema';
import { Employee, EmployeeDocument } from '../employees/schemas/employee.schema';
import { GeminiService } from '../ai/gemini.service';
import { Skill, SkillDocument } from '../skills/schemas/skill.schema';
import { JobDescriptionDto } from './dto/job-description.dto';
import { QueryRecommendationsDto } from './dto/query-recommendations.dto';
import { UpdateRecommendationStatusDto } from './dto/update-recommendation-status.dto';
import { Recommendation, RecommendationDocument } from './schemas/recommendation.schema';

@Injectable()
export class RecommendationsService {
  constructor(
    @InjectModel(Recommendation.name)
    private readonly recommendationModel: Model<RecommendationDocument>,
    @InjectModel(Employee.name)
    private readonly employeeModel: Model<EmployeeDocument>,
    @InjectModel(Activity.name)
    private readonly activityModel: Model<ActivityDocument>,
    @InjectModel(Skill.name)
    private readonly skillModel: Model<SkillDocument>,
    private readonly geminiService: GeminiService,
  ) { }

  private async syncSpecializedSkillsAssignments() {
    const [employees, skills] = await Promise.all([
      this.employeeModel.find().lean(),
      this.skillModel.find(),
    ]);

    const skillByName = new Map(
      skills.map((skill) => [skill.name.toLowerCase().trim(), skill]),
    );

    for (const employee of employees) {
      for (const specializedSkill of employee.specializedSkills || []) {
        const normalized = specializedSkill.toLowerCase().trim();
        const skill = skillByName.get(normalized);
        if (!skill) continue;

        const alreadyAssigned = (skill.assignments || []).some(
          (item: any) => item.employeeId.toString() === employee._id.toString(),
        );

        if (alreadyAssigned) continue;

        skill.assignments.push({
          employeeId: employee._id,
          employeeName: employee.fullName,
          level: 2,
          notes: 'Auto-assigned from employee specialized skills',
          yearsOfExperience: employee.yearsOfExperience || 0,
          validated: false,
          validatedBy: 'System',
        } as any);
      }
    }

    await Promise.all(skills.map((skill) => skill.save()));
  }

  private async autoEnrollFromRecommendations(_items: Array<any>) {
    // Auto-enrollment is disabled.
    // Recommendations are generated for display only; enrollment is done manually.
  }

  private async computeRecommendations() {
    const [employees, activities, skills] = await Promise.all([
      this.employeeModel.find().lean(),
      this.activityModel.find().lean(),
      this.skillModel.find().lean(),
    ]);

    const employeeSkillMap = new Map<string, Map<string, any>>();
    for (const skill of skills) {
      for (const assignment of skill.assignments || []) {
        const employeeId = assignment.employeeId.toString();
        if (!employeeSkillMap.has(employeeId)) {
          employeeSkillMap.set(employeeId, new Map());
        }
        employeeSkillMap.get(employeeId)!.set(skill.name.toLowerCase(), assignment);
      }
    }

    return employees.flatMap((employee) => {
      const ownedSkills = employeeSkillMap.get(employee._id.toString()) || new Map<string, any>();
      const specializedSkills = new Set(
        (employee.specializedSkills || []).map((skill: string) =>
          skill.toLowerCase().trim(),
        ),
      );

      return activities.map((activity) => {
        const matchedSkills: string[] = [];
        const missingSkills: string[] = [];
        let earned = 0;
        let target = 0;

        for (const requirement of activity.requiredSkills || []) {
          target += requirement.level * 25;
          const assignment = ownedSkills.get(requirement.name.toLowerCase());
          const hasSpecializedSkill = specializedSkills.has(
            requirement.name.toLowerCase(),
          );
          const level = assignment?.level || 0;

          if (!assignment && hasSpecializedSkill) {
            matchedSkills.push(`${requirement.name} (specialized profile)`);
            earned += requirement.level * 22;
            continue;
          }

          if (level >= requirement.level) {
            matchedSkills.push(requirement.name);
            earned += requirement.level * 25;
            if (assignment?.validated) earned += 5;
            if (assignment?.yearsOfExperience) earned += Math.min(assignment.yearsOfExperience * 2, 6);
          } else if (level > 0) {
            matchedSkills.push(`${requirement.name} (partial)`);
            missingSkills.push(`${requirement.name} needs level ${requirement.level}`);
            earned += level * 18;
          } else {
            missingSkills.push(`${requirement.name} missing`);
          }
        }

        const completionBonus = (employee.activitiesCount || 0) > 0 ? Math.min((employee.activitiesCount || 0) * 3, 15) : 0;
        const experienceBonus = (employee.yearsOfExperience || 0) > 0 ? Math.min((employee.yearsOfExperience || 0) * 2, 10) : 0;
        const certificationBonus = Math.min((employee.certifications || []).length * 3, 12);
        const departmentBonus = activity.targetDepartment && employee.department === activity.targetDepartment ? 10 : 0;
        const score = target === 0
          ? 50 + departmentBonus + certificationBonus
          : Math.max(0, Math.min(100, Math.round((earned / target) * 65 + completionBonus + experienceBonus + certificationBonus + departmentBonus)));

        const occupiedSeats = (activity.enrollments || []).length;
        const activitySeats = Math.max(activity.seats || 0, 0);
        const availableSeats = Math.max(activitySeats - occupiedSeats, 0);

        return {
          employeeId: employee._id,
          employeeName: employee.fullName,
          activityId: activity._id,
          activityTitle: activity.title,
          activitySeats,
          occupiedSeats,
          availableSeats,
          eligibleEmployeesCount: 0,
          score,
          matchedSkills,
          missingSkills,
          rationale: score >= 85
            ? 'Strong fit with validated skills, relevant experience, and department alignment.'
            : score >= 65
              ? 'Promising fit with some gaps to close before full deployment.'
              : 'Needs upskilling or manager coaching before this activity becomes a clean match.',
        };
      });
    });
  }

  async refresh() {
    await this.syncSpecializedSkillsAssignments();
    const computed = await this.computeRecommendations();
    const eligibleByActivity = new Map<string, number>();

    for (const item of computed) {
      if (item.score < 60) continue;
      const key = item.activityId.toString();
      eligibleByActivity.set(key, (eligibleByActivity.get(key) || 0) + 1);
    }

    const enriched = computed.map((item) => ({
      ...item,
      eligibleEmployeesCount: eligibleByActivity.get(item.activityId.toString()) || 0,
    }));

    // Auto-enrollment disabled per user request

    const existing = await this.recommendationModel.find().lean();
    const statusMap = new Map(existing.map((item) => [`${item.employeeId.toString()}_${item.activityId.toString()}`, item.status]));
    await this.recommendationModel.deleteMany({});
    const payload = enriched.map((item) => ({ ...item, status: statusMap.get(`${item.employeeId.toString()}_${item.activityId.toString()}`) || 'Open' }));
    if (payload.length) await this.recommendationModel.insertMany(payload);
    return this.findAll({});
  }

  async findAll(query: QueryRecommendationsDto) {
    const filter: Record<string, any> = {};
    if (query.search) {
      filter.$or = [
        { employeeName: { $regex: query.search, $options: 'i' } },
        { activityTitle: { $regex: query.search, $options: 'i' } },
        { matchedSkills: { $regex: query.search, $options: 'i' } },
      ];
    }

    if (query.skill) {
      const skillFilter = {
        $or: [
          { matchedSkills: { $regex: query.skill, $options: 'i' } },
          { missingSkills: { $regex: query.skill, $options: 'i' } },
        ],
      };
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, skillFilter];
        delete filter.$or;
      } else {
        filter.$or = skillFilter.$or;
      }
    }

    if (query.matchLevel && query.matchLevel !== 'All') {
      if (query.matchLevel === 'Strong') filter.score = { $gte: 80 };
      else if (query.matchLevel === 'Good') filter.score = { $gte: 60, $lt: 80 };
      else if (query.matchLevel === 'Partial') filter.score = { $lt: 60 };
    }

    if (query.status && query.status !== 'All') filter.status = query.status;
    if (query.employeeId) filter.employeeId = query.employeeId;
    if (query.activityId) filter.activityId = query.activityId;
    const items = await this.recommendationModel.find(filter).sort({ score: -1, createdAt: -1 });
    return { total: items.length, items };
  }

  async updateStatus(id: string, dto: UpdateRecommendationStatusDto) {
    const item = await this.recommendationModel.findByIdAndUpdate(id, { status: dto.status }, { new: true, runValidators: true });
    if (!item) throw new NotFoundException('Recommendation not found');
    return item;
  }

  /**
   * Match employees to job description using AI
   */
  async matchJobDescription(dto: JobDescriptionDto) {
    // Step 1: Extract skills from job description using AI
    const requiredSkills = await this.geminiService.extractSkills(dto.jobDescription);

    // Step 2: Build filter for active employees
    const filter: Record<string, any> = { status: 'Active' };

    if (dto.department) {
      filter.department = { $regex: new RegExp(dto.department.trim(), 'i') };
    }
    if (dto.minYearsExperience !== undefined) {
      filter.yearsOfExperience = { $gte: dto.minYearsExperience };
    }

    // Step 3: Get candidate employees
    const employees = await this.employeeModel.find(filter).lean();
    if (employees.length === 0) {
      return { total: 0, items: [], requiredSkills };
    }

    // Step 4: Get all skills with employee assignments
    const skills = await this.skillModel.find().lean();
    const skillMap = new Map<string, string[]>(); // skillName -> employeeIds

    for (const skill of skills) {
      const assignedEmployeeIds = (skill.assignments || [])
        .map((a: any) => a.employeeId.toString());
      skillMap.set(skill.name.toLowerCase(), assignedEmployeeIds);
    }

    // Step 5: Calculate preliminary matches
    const candidateEmployees = employees.map((emp) => {
      const empId = emp._id.toString();
      const matchedSkills: string[] = [];
      const missingSkills: string[] = [];

      for (const skill of requiredSkills) {
        const skillLower = skill.toLowerCase();
        const hasSkill = Array.from(skillMap.entries()).some(
          ([skillName, empIds]) =>
            skillName.includes(skillLower) || skillLower.includes(skillName),
        );

        if (hasSkill && skillMap.get(skillLower)?.includes(empId)) {
          matchedSkills.push(skill);
        } else {
          missingSkills.push(skill);
        }
      }

      return {
        employee: emp,
        matchedSkills,
        missingSkills,
        matchRatio: requiredSkills.length > 0 ? matchedSkills.length / requiredSkills.length : 0,
      };
    });

    // Step 6: Filter candidates with at least partial match
    const filteredCandidates = candidateEmployees.filter((c) => c.matchRatio > 0);
    if (filteredCandidates.length === 0) {
      return { total: 0, items: [], requiredSkills };
    }

    // Step 7: Send to AI for ranking with scores and explanations
    const rankedCandidates = await this.rankCandidatesWithAI(filteredCandidates, dto.jobDescription, requiredSkills);

    return {
      total: rankedCandidates.length,
      items: rankedCandidates,
      requiredSkills,
    };
  }

  /**
   * Rank candidates using AI with scores and explanations
   */
  private async rankCandidatesWithAI(
    candidates: any[],
    jobDescription: string,
    requiredSkills: string[],
  ) {
    // Prepare candidate data for AI
    const candidateData = candidates.map((c) => ({
      id: c.employee._id.toString(),
      name: c.employee.fullName,
      department: c.employee.department,
      position: c.employee.position,
      yearsOfExperience: c.employee.yearsOfExperience || 0,
      matchedSkills: c.matchedSkills,
      missingSkills: c.missingSkills,
    }));

    const prompt = `You are an expert HR recruiter. Analyze these candidates against the job description and rank them from best to worst match.

Job Description:
"${jobDescription}"

Required Skills: ${requiredSkills.join(', ')}

Candidates:
${JSON.stringify(candidateData, null, 2)}

For each candidate, provide:
1. score: 0-100 (overall match percentage)
2. explanation: Brief 1-2 sentence explanation of why they match or don't match

Return ONLY a JSON array in this exact format:
[
  {
    "employeeId": "id",
    "score": 85,
    "explanation": "Strong match with Node.js and 5 years backend experience"
  }
]

Do not include any other text before or after the JSON.`;

    try {
      const aiResponse = await this.geminiService.callGemini(prompt);

      // Parse AI response
      let rankings: any[] = [];
      try {
        // Try to extract JSON from response
        const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          rankings = JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        // Fallback: use candidate order with basic scoring
        rankings = candidates.map((c, index) => ({
          employeeId: c.employee._id.toString(),
          score: Math.round(c.matchRatio * 100),
          explanation: `Matches ${c.matchedSkills.length} of ${requiredSkills.length} required skills`,
        }));
      }

      // Merge AI rankings with full employee data
      const result = rankings
        .map((ranking) => {
          const candidate = candidates.find(
            (c) => c.employee._id.toString() === ranking.employeeId,
          );
          if (!candidate) return null;

          return {
            employee: {
              _id: candidate.employee._id.toString(),
              fullName: candidate.employee.fullName,
              email: candidate.employee.email,
              department: candidate.employee.department,
              position: candidate.employee.position,
              yearsOfExperience: candidate.employee.yearsOfExperience || 0,
            },
            score: ranking.score,
            explanation: ranking.explanation,
            matchedSkills: candidate.matchedSkills,
            missingSkills: candidate.missingSkills,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      // Sort by score descending
      return result.sort((a, b) => b.score - a.score);
    } catch (error) {
      console.error('AI ranking failed:', error);
      // Fallback: manual scoring
      return candidates.map((c) => ({
        employee: {
          _id: c.employee._id.toString(),
          fullName: c.employee.fullName,
          email: c.employee.email,
          department: c.employee.department,
          position: c.employee.position,
          yearsOfExperience: c.employee.yearsOfExperience || 0,
        },
        score: Math.round(c.matchRatio * 100),
        explanation: `Matches ${c.matchedSkills.length} of ${requiredSkills.length} required skills: ${c.matchedSkills.join(', ')}`,
        matchedSkills: c.matchedSkills,
        missingSkills: c.missingSkills,
      })).sort((a, b) => b.score - a.score);
    }
  }
}

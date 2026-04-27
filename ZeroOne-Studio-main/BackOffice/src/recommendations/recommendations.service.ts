import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Activity, ActivityDocument } from '../activities/schemas/activity.schema';
import { Employee, EmployeeDocument } from '../employees/schemas/employee.schema';
import { Skill, SkillDocument } from '../skills/schemas/skill.schema';
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
}

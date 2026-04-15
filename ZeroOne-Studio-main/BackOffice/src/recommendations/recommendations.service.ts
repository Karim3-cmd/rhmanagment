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
      return activities.map((activity) => {
        const matchedSkills: string[] = [];
        const missingSkills: string[] = [];
        let earned = 0;
        let target = 0;

        for (const requirement of activity.requiredSkills || []) {
          target += requirement.level * 25;
          const assignment = ownedSkills.get(requirement.name.toLowerCase());
          const level = assignment?.level || 0;
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

        return {
          employeeId: employee._id,
          employeeName: employee.fullName,
          activityId: activity._id,
          activityTitle: activity.title,
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
    const computed = await this.computeRecommendations();
    const existing = await this.recommendationModel.find().lean();
    const statusMap = new Map(existing.map((item) => [`${item.employeeId.toString()}_${item.activityId.toString()}`, item.status]));
    await this.recommendationModel.deleteMany({});
    const payload = computed.map((item) => ({ ...item, status: statusMap.get(`${item.employeeId.toString()}_${item.activityId.toString()}`) || 'Open' }));
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

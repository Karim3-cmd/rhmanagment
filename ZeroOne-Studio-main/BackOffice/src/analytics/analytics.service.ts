import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Activity, ActivityDocument } from '../activities/schemas/activity.schema';
import { Employee, EmployeeDocument } from '../employees/schemas/employee.schema';
import { Recommendation, RecommendationDocument } from '../recommendations/schemas/recommendation.schema';
import { Skill, SkillDocument } from '../skills/schemas/skill.schema';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Employee.name)
    private readonly employeeModel: Model<EmployeeDocument>,
    @InjectModel(Skill.name)
    private readonly skillModel: Model<SkillDocument>,
    @InjectModel(Activity.name)
    private readonly activityModel: Model<ActivityDocument>,
    @InjectModel(Recommendation.name)
    private readonly recommendationModel: Model<RecommendationDocument>,
  ) { }

  async getDashboard() {
    const [employees, skills, activities, recommendations] = await Promise.all([
      this.employeeModel.find().lean(),
      this.skillModel.find().lean(),
      this.activityModel.find().lean(),
      this.recommendationModel.find().lean(),
    ]);

    const departments = Array.from(new Set(employees.map((item) => item.department || 'Unassigned')));

    const metrics = {
      skillsAdded: skills.length,
      avgSkillLevel: skills.length
        ? Number((skills.reduce((sum, skill) => {
          const assignments = skill.assignments || [];
          const avg = assignments.length ? assignments.reduce((s, a) => s + a.level, 0) / assignments.length : 0;
          return sum + avg;
        }, 0) / skills.length).toFixed(1))
        : 0,
      activeEmployees: employees.filter((employee) => (employee.status || 'Active') === 'Active').length,
      completionRate: activities.length
        ? Math.round((activities.filter((activity) => (activity.enrollments || []).some((item) => item.status === 'Completed')).length / activities.length) * 100)
        : 0,
    };

    // 1. Employees by Department
    const employeesByDepartment = departments.map((department) => ({
      name: department,
      value: employees.filter((employee) => (employee.department || 'Unassigned') === department).length,
    }));

    // 2. Top 5 Skills
    const topSkills = skills
      .map((skill) => ({
        name: skill.name,
        value: (skill.assignments || []).length,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // 3. Activity Statuses
    const activityStatuses = [
      { name: 'Draft', value: activities.filter((a) => a.status === 'Draft').length },
      { name: 'Published', value: activities.filter((a) => a.status === 'Published').length },
      { name: 'Archived', value: activities.filter((a) => a.status === 'Archived').length },
    ].filter((item) => item.value > 0);

    // 4. Recommendation Statuses
    const recommendationStatuses = [
      { name: 'Open', value: recommendations.filter((r) => r.status === 'Open').length },
      { name: 'Accepted', value: recommendations.filter((r) => r.status === 'Accepted').length },
      { name: 'Dismissed', value: recommendations.filter((r) => r.status === 'Dismissed').length },
    ].filter((item) => item.value > 0);

    const summary = {
      totalRecommendations: recommendations.length,
      successfulPlacements: recommendations.filter((item) => item.status === 'Accepted').length,
      averageTimeToMatch: activities.length ? Number((activities.reduce((sum, item) => sum + ((item.enrollments || []).length ? 2 : 4), 0) / activities.length).toFixed(1)) : 0,
    };

    return { metrics, employeesByDepartment, topSkills, activityStatuses, recommendationStatuses, summary };
  }

  async getEmployeeEvolution(employeeId: string) {
    const [employee, skills, activities, recommendations] = await Promise.all([
      this.employeeModel.findById(employeeId).lean(),
      this.skillModel.find({ 'assignments.employeeId': employeeId }).lean(),
      this.activityModel.find({ 'enrollments.employeeId': employeeId }).lean(),
      this.recommendationModel.find({ employeeId }).sort({ createdAt: 1 }).lean(),
    ]);

    if (!employee) throw new NotFoundException('Employee not found');

    const skillItems = skills.map((skill) => {
      const assignment = (skill.assignments || []).find((item) => item.employeeId.toString() === employeeId);
      return {
        skill: skill.name,
        level: assignment?.level || 0,
        validated: !!assignment?.validated,
        yearsOfExperience: assignment?.yearsOfExperience || 0,
      };
    });

    const activityItems = activities.map((activity) => {
      const enrollment = (activity.enrollments || []).find((item) => item.employeeId.toString() === employeeId);
      return {
        activityId: activity._id,
        title: activity.title,
        status: enrollment?.status || 'Pending Approval',
        progress: enrollment?.progress || 0,
        proofs: enrollment?.proofs || [],
      };
    });

    const evolution = recommendations.map((item, index) => ({
      step: `R${index + 1}`,
      score: item.score,
      status: item.status,
    }));

    return {
      employeeId,
      employeeName: employee.fullName,
      metrics: {
        certifications: (employee.certifications || []).length,
        activities: activityItems.length,
        completedActivities: activityItems.filter((item) => item.status === 'Completed').length,
        validatedSkills: skillItems.filter((item) => item.validated).length,
      },
      skills: skillItems,
      activities: activityItems,
      evolution,
    };
  }
}

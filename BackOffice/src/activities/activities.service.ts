import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Employee, EmployeeDocument } from '../employees/schemas/employee.schema';
import { Recommendation, RecommendationDocument } from '../recommendations/schemas/recommendation.schema';
import { CreateActivityDto } from './dto/create-activity.dto';
import { EnrollActivityDto } from './dto/enroll-activity.dto';
import { QueryActivitiesDto } from './dto/query-activities.dto';
import { ReviewActivityEnrollmentDto } from './dto/review-activity-enrollment.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { UpdateActivityProgressDto } from './dto/update-activity-progress.dto';
import { Activity, ActivityDocument } from './schemas/activity.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectModel(Activity.name)
    private readonly activityModel: Model<ActivityDocument>,
    @InjectModel(Employee.name)
    private readonly employeeModel: Model<EmployeeDocument>,
    @InjectModel(Recommendation.name)
    private readonly recommendationModel: Model<RecommendationDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly notificationsService: NotificationsService,
  ) { }

  private mapActivity(activity: ActivityDocument | (Activity & { _id: Types.ObjectId })) {
    const raw: any = 'toObject' in activity ? activity.toObject() : activity;
    return {
      ...raw,
      enrolled: raw.enrollments?.length || 0,
    };
  }

  private async syncEmployeeActivityCounts() {
    const activities = await this.activityModel.find().lean();
    const countMap = new Map<string, number>();

    for (const activity of activities) {
      const seen = new Set<string>();
      for (const enrollment of activity.enrollments || []) {
        if (['Rejected'].includes(enrollment.status)) continue;
        const id = String(enrollment.employeeId);
        if (seen.has(id)) continue;
        seen.add(id);
        countMap.set(id, (countMap.get(id) || 0) + 1);
      }
    }

    const employees = await this.employeeModel.find().select('_id');
    await Promise.all(
      employees.map((employee) =>
        this.employeeModel.findByIdAndUpdate(employee._id, {
          activitiesCount: countMap.get(employee._id.toString()) || 0,
        }),
      ),
    );
  }

  async create(dto: CreateActivityDto) {
    const created = await this.activityModel.create({
      ...dto,
      description: dto.description || '',
      context: dto.context || 'Upskilling',
      requiredSkills: dto.requiredSkills || [],
      seats: dto.seats || 10,
      status: dto.status || 'Draft',
      targetDepartment: dto.targetDepartment || '',
      requiresManagerApproval: dto.requiresManagerApproval || false,
      startDate: dto.startDate || '',
      endDate: dto.endDate || '',
    });
    return this.mapActivity(created);
  }

  async findAll(query: QueryActivitiesDto) {
    const filter: Record<string, any> = {};

    if (query.search) {
      filter.$or = [
        { title: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
        { 'requiredSkills.name': { $regex: query.search, $options: 'i' } },
      ];
    }

    if (query.context && query.context !== 'All') {
      filter.context = query.context;
    }

    if (query.status && query.status !== 'All') {
      filter.status = query.status;
    }

    if (query.targetDepartment) {
      filter.targetDepartment = query.targetDepartment;
    }

    if (query.employeeId && query.onlyMine === 'true') {
      filter['enrollments.employeeId'] = new Types.ObjectId(query.employeeId);
    }

    const items = await this.activityModel.find(filter).sort({ createdAt: -1 });
    return {
      total: items.length,
      items: items.map((item) => this.mapActivity(item)),
    };
  }

  async findById(id: string) {
    const activity = await this.activityModel.findById(id);
    if (!activity) throw new NotFoundException('Activity not found');
    return this.mapActivity(activity);
  }

  async update(id: string, dto: UpdateActivityDto) {
    const updated = await this.activityModel.findByIdAndUpdate(
      id,
      { ...dto, requiredSkills: dto.requiredSkills },
      { new: true, runValidators: true },
    );

    if (!updated) throw new NotFoundException('Activity not found');
    return this.mapActivity(updated);
  }

  async remove(id: string) {
    const deleted = await this.activityModel.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundException('Activity not found');
    await this.syncEmployeeActivityCounts();
    return { message: 'Activity deleted successfully' };
  }

  async enroll(activityId: string, dto: EnrollActivityDto, byHR: boolean = false) {
    const activity = await this.activityModel.findById(activityId);
    if (!activity) throw new NotFoundException('Activity not found');

    const employee = await this.employeeModel.findById(dto.employeeId);
    if (!employee) throw new NotFoundException('Employee not found');

    if (activity.targetDepartment && employee.department && activity.targetDepartment !== employee.department) {
      throw new BadRequestException('Employee department does not match target department');
    }

    if ((activity.enrollments || []).some((item) => item.employeeId.toString() === dto.employeeId)) {
      throw new BadRequestException('Employee already enrolled in this activity');
    }

    if (activity.seats > 0 && (activity.enrollments?.length || 0) >= activity.seats) {
      throw new BadRequestException('No seats left for this activity');
    }

    // If HR is assigning, require manager approval
    const status = byHR ? 'Pending Manager Approval' : 'Approved';
    const managerDecision = byHR ? 'Awaiting manager approval' : 'Auto approved (self-enrollment)';

    activity.enrollments.push({
      employeeId: new Types.ObjectId(dto.employeeId),
      employeeName: employee.fullName,
      notes: dto.notes || '',
      status,
      managerDecision,
      enrolledAt: new Date().toISOString(),
      progress: 0,
      proofs: [],
    } as any);

    await activity.save();
    await this.syncEmployeeActivityCounts();

    // If HR assigned, send notification to employee's manager
    if (byHR) {
      await this.notifyManagerOfPendingApproval(activity, employee);
    }

    return this.mapActivity(activity);
  }

  async assign(activityId: string, dto: { employeeId: string; notes?: string }) {
    // HR assigns employee - requires manager approval
    return this.enroll(activityId, dto, true);
  }

  private async notifyManagerOfPendingApproval(activity: ActivityDocument, employee: EmployeeDocument) {
    // Find the manager of the employee's department
    const manager = await this.userModel.findOne({
      department: employee.department,
      role: 'Manager',
      isActive: true,
    });

    if (manager) {
      await this.notificationsService.create({
        userId: manager._id.toString(),
        title: 'New Activity Assignment Requires Approval',
        message: `Employee ${employee.fullName} has been assigned to activity "${activity.title}". Please review and approve/reject.`,
        type: 'info',
        category: 'Activity',
        link: `/activities/${activity._id}`,
      });
    }
  }

  async approveEnrollment(activityId: string, employeeId: string, reviewedBy: string, reviewNote?: string, progressWeight: number = 25, managerUserId?: string) {
    const activity = await this.activityModel.findById(activityId);
    if (!activity) throw new NotFoundException('Activity not found');

    const enrollment = activity.enrollments.find((item) => item.employeeId.toString() === employeeId);
    if (!enrollment) throw new NotFoundException('Enrollment not found');

    if (enrollment.status !== 'Pending Manager Approval') {
      throw new BadRequestException('Enrollment is not pending manager approval');
    }

    // Verify manager can approve for this employee's department
    if (managerUserId) {
      const employee = await this.employeeModel.findById(employeeId);
      const manager = await this.userModel.findById(managerUserId);
      if (!manager || manager.role !== 'Manager') {
        throw new BadRequestException('Only managers can approve enrollments');
      }
      if (manager.department !== employee?.department) {
        throw new BadRequestException('You can only approve enrollments for employees in your department');
      }
    }

    enrollment.status = 'Approved';
    enrollment.managerDecision = reviewNote || 'Approved by manager';
    enrollment.reviewedBy = reviewedBy;
    enrollment.reviewedAt = new Date().toISOString();
    enrollment.startedAt = new Date().toISOString();

    await activity.save();
    await this.syncEmployeeActivityCounts();

    // Notify employee
    await this.notificationsService.create({
      userId: employeeId,
      title: 'Activity Assignment Approved',
      message: `Your assignment to "${activity.title}" has been approved by your manager.`,
      type: 'info',
      category: 'Activity',
      link: `/activities/${activityId}`,
    });

    return this.mapActivity(activity);
  }

  async rejectEnrollment(activityId: string, employeeId: string, reviewedBy: string, reviewNote?: string, managerUserId?: string) {
    const activity = await this.activityModel.findById(activityId);
    if (!activity) throw new NotFoundException('Activity not found');

    const enrollment = activity.enrollments.find((item) => item.employeeId.toString() === employeeId);
    if (!enrollment) throw new NotFoundException('Enrollment not found');

    if (enrollment.status !== 'Pending Manager Approval') {
      throw new BadRequestException('Enrollment is not pending manager approval');
    }

    // Verify manager can reject for this employee's department
    if (managerUserId) {
      const employee = await this.employeeModel.findById(employeeId);
      const manager = await this.userModel.findById(managerUserId);
      if (!manager || manager.role !== 'Manager') {
        throw new BadRequestException('Only managers can reject enrollments');
      }
      if (manager.department !== employee?.department) {
        throw new BadRequestException('You can only reject enrollments for employees in your department');
      }
    }

    enrollment.status = 'Rejected';
    enrollment.managerDecision = reviewNote || 'Rejected by manager';
    enrollment.reviewedBy = reviewedBy;
    enrollment.reviewedAt = new Date().toISOString();

    await activity.save();
    await this.syncEmployeeActivityCounts();

    // Notify employee
    await this.notificationsService.create({
      userId: employeeId,
      title: 'Activity Assignment Rejected',
      message: `Your assignment to "${activity.title}" has been rejected by your manager.`,
      type: 'warning',
      category: 'Activity',
      link: `/activities/${activityId}`,
    });

    return this.mapActivity(activity);
  }

  async getPendingApprovals(managerUserId: string) {
    const manager = await this.userModel.findById(managerUserId);
    console.log('[DEBUG] Manager:', manager?.email, 'Role:', manager?.role, 'Department:', manager?.department);

    if (!manager) {
      throw new BadRequestException(`User not found for ID: ${managerUserId}`);
    }
    if (manager.role !== 'Manager' && manager.role !== 'HR') {
      throw new BadRequestException(`Role error: User role is ${manager.role}. Only managers/HR can view.`);
    }

    // Get all activities with enrollments pending manager approval
    const activities = await this.activityModel.find().lean();
    const pendingApprovals: Array<{
      activityId: string;
      activityTitle: string;
      employeeId: string;
      employeeName: string;
      employeeDepartment: string;
      enrolledAt: string;
      notes: string;
    }> = [];

    for (const activity of activities) {
      for (const enrollment of activity.enrollments || []) {
        console.log('[DEBUG] Enrollment status:', enrollment.status, '| Employee:', enrollment.employeeName, '| Activity:', activity.title);
        console.log('[DEBUG] Status check:', enrollment.status === 'Pending Manager Approval', 'Type:', typeof enrollment.status);
        if (enrollment.status === 'Pending Manager Approval') {
          // Get employee department to verify it matches manager's department
          const employee = await this.employeeModel.findById(enrollment.employeeId.toString()).lean();
          console.log('[DEBUG] Employee dept:', employee?.department, '| Manager dept:', manager?.department);
          console.log('[DEBUG] Dept match:', employee?.department === manager?.department, '| Case sensitive check');
          if (employee && employee.department && manager?.department && employee.department === manager.department) {
            pendingApprovals.push({
              activityId: activity._id.toString(),
              activityTitle: activity.title,
              employeeId: enrollment.employeeId.toString(),
              employeeName: enrollment.employeeName,
              employeeDepartment: employee.department || '',
              enrolledAt: enrollment.enrolledAt,
              notes: enrollment.notes,
            });
          }
        }
      }
    }

    console.log('[DEBUG] Found approvals:', pendingApprovals.length);
    return { total: pendingApprovals.length, items: pendingApprovals };
  }

  async reviewEnrollment(activityId: string, employeeId: string, dto: ReviewActivityEnrollmentDto) {
    const activity = await this.activityModel.findById(activityId);
    if (!activity) throw new NotFoundException('Activity not found');
    const enrollment = activity.enrollments.find((item) => item.employeeId.toString() === employeeId);
    if (!enrollment) throw new NotFoundException('Enrollment not found');

    enrollment.status = dto.decision;
    enrollment.managerDecision = dto.note || dto.decision;
    enrollment.reviewedBy = dto.reviewedBy || '';
    enrollment.reviewedAt = new Date().toISOString();
    if (dto.decision === 'Approved' && !enrollment.startedAt) {
      enrollment.startedAt = new Date().toISOString();
    }

    await activity.save();
    await this.syncEmployeeActivityCounts();
    return this.mapActivity(activity);
  }

  async updateProgress(activityId: string, employeeId: string, dto: UpdateActivityProgressDto) {
    const activity = await this.activityModel.findById(activityId);
    if (!activity) throw new NotFoundException('Activity not found');
    const enrollment = activity.enrollments.find((item) => item.employeeId.toString() === employeeId);
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    if (['Rejected', 'Pending Approval'].includes(enrollment.status)) {
      throw new BadRequestException('This enrollment cannot progress yet');
    }

    if (typeof dto.progress === 'number') {
      enrollment.progress = dto.progress;
      if (dto.progress > 0 && !enrollment.startedAt) enrollment.startedAt = new Date().toISOString();
      if (dto.progress >= 100) {
        enrollment.status = 'Completed';
        enrollment.completedAt = new Date().toISOString();
      } else {
        enrollment.status = 'In Progress';
      }
    }
    if (dto.notes !== undefined) enrollment.notes = dto.notes;
    if (dto.proofs?.length) {
      enrollment.proofs.push(...dto.proofs.map((proof) => ({
        title: proof.title || '',
        type: proof.type || 'Evidence',
        url: proof.url || '',
        note: proof.note || '',
        createdAt: new Date().toISOString(),
      })) as any);
    }

    await activity.save();
    return this.mapActivity(activity);
  }

  async submitProof(activityId: string, employeeId: string, proofData: { title: string; type: string; url: string; note: string }) {
    const activity = await this.activityModel.findById(activityId);
    if (!activity) throw new NotFoundException('Activity not found');

    const enrollment = activity.enrollments.find((item) => item.employeeId.toString() === employeeId);
    if (!enrollment) throw new NotFoundException('Enrollment not found');

    // Calculate suggested progress weight based on current progress
    const currentApprovedProgress = enrollment.proofs
      .filter((p) => p.status === 'approved')
      .reduce((sum, p) => sum + (p.progressWeight || 0), 0);
    const suggestedWeight = Math.min(25, 100 - currentApprovedProgress); // Max 25% per proof, or fill to 100%

    const newProof = {
      title: proofData.title,
      type: proofData.type,
      url: proofData.url,
      note: proofData.note,
      createdAt: new Date().toISOString(),
      status: 'pending',
      progressWeight: suggestedWeight,
      reviewedBy: '',
      reviewedAt: '',
      reviewNote: '',
    } as any;

    enrollment.proofs.push(newProof);
    await activity.save();

    return {
      message: 'Proof submitted successfully',
      proof: newProof,
    };
  }

  async reviewProof(activityId: string, employeeId: string, proofIndex: number, reviewData: { decision: 'approved' | 'rejected'; reviewNote: string; reviewedBy: string; progressWeight?: number }) {
    const activity = await this.activityModel.findById(activityId);
    if (!activity) throw new NotFoundException('Activity not found');

    const enrollment = activity.enrollments.find((item) => item.employeeId.toString() === employeeId);
    if (!enrollment) throw new NotFoundException('Enrollment not found');

    if (proofIndex < 0 || proofIndex >= enrollment.proofs.length) {
      throw new NotFoundException('Proof not found');
    }

    const proof = enrollment.proofs[proofIndex];
    proof.status = reviewData.decision;
    proof.reviewNote = reviewData.reviewNote || '';
    proof.reviewedBy = reviewData.reviewedBy || '';
    proof.reviewedAt = new Date().toISOString();

    // If approved, use the suggested or provided progress weight
    if (reviewData.decision === 'approved') {
      proof.progressWeight = reviewData.progressWeight !== undefined ? reviewData.progressWeight : proof.progressWeight;
    }

    // Recalculate total progress based on approved proofs
    const totalProgress = enrollment.proofs
      .filter((p) => p.status === 'approved')
      .reduce((sum, p) => sum + (p.progressWeight || 0), 0);

    enrollment.progress = Math.min(100, totalProgress);

    // Update status based on progress
    if (enrollment.progress >= 100) {
      enrollment.status = 'Completed';
      enrollment.completedAt = new Date().toISOString();
    } else if (enrollment.progress > 0) {
      enrollment.status = 'In Progress';
      if (!enrollment.startedAt) {
        enrollment.startedAt = new Date().toISOString();
      }
    }

    await activity.save();

    return {
      message: `Proof ${reviewData.decision}`,
      progress: enrollment.progress,
      proof,
    };
  }

  async getMyActivities(employeeId: string) {
    return this.findAll({ employeeId, onlyMine: 'true' } as any);
  }

  async getCandidates(activityId: string) {
    const activity = await this.activityModel.findById(activityId).lean();
    if (!activity) throw new NotFoundException('Activity not found');
    const items = await this.recommendationModel.find({ activityId }).sort({ score: -1 }).limit(10);
    return {
      activityId,
      activityTitle: activity.title,
      items,
    };
  }

  async unenroll(activityId: string, employeeId: string) {
    const activity = await this.activityModel.findById(activityId);
    if (!activity) throw new NotFoundException('Activity not found');

    activity.enrollments = activity.enrollments.filter(
      (item) => item.employeeId.toString() !== employeeId,
    ) as any;

    await activity.save();
    await this.syncEmployeeActivityCounts();
    return this.mapActivity(activity);
  }
}

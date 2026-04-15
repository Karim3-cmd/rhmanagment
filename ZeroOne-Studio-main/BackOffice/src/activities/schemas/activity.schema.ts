import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ActivityDocument = HydratedDocument<Activity>;

@Schema({ _id: false })
export class ActivitySkillRequirement {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, min: 1, max: 4 })
  level: number;
}

export const ActivitySkillRequirementSchema = SchemaFactory.createForClass(ActivitySkillRequirement);

@Schema({ _id: false })
export class ActivityProof {
  @Prop({ default: '' })
  title: string;

  @Prop({ default: '' })
  type: string;

  @Prop({ default: '' })
  url: string;

  @Prop({ default: '' })
  note: string;

  @Prop({ default: () => new Date().toISOString() })
  createdAt: string;

  @Prop({ default: 'pending', enum: ['pending', 'approved', 'rejected'] })
  status: string;

  @Prop({ default: 0, min: 0, max: 100 })
  progressWeight: number;

  @Prop({ default: '' })
  reviewedBy: string;

  @Prop({ default: '' })
  reviewedAt: string;

  @Prop({ default: '' })
  reviewNote: string;
}

export const ActivityProofSchema = SchemaFactory.createForClass(ActivityProof);

@Schema({ _id: false })
export class ActivityEnrollment {
  @Prop({ type: Types.ObjectId, required: true })
  employeeId: Types.ObjectId;

  @Prop({ required: true })
  employeeName: string;

  @Prop({ default: 'Pending Approval' })
  status: string;

  @Prop({ default: '' })
  notes: string;

  @Prop({ default: 0, min: 0, max: 100 })
  progress: number;

  @Prop({ default: '' })
  managerDecision: string;

  @Prop({ default: '' })
  reviewedBy: string;

  @Prop({ default: '' })
  reviewedAt: string;

  @Prop({ default: '' })
  startedAt: string;

  @Prop({ default: '' })
  completedAt: string;

  @Prop({ type: [ActivityProofSchema], default: [] })
  proofs: ActivityProof[];

  @Prop({ default: () => new Date().toISOString() })
  enrolledAt: string;
}

export const ActivityEnrollmentSchema = SchemaFactory.createForClass(ActivityEnrollment);

@Schema({ timestamps: true })
export class Activity {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ required: true, enum: ['Upskilling', 'Expertise', 'Development'] })
  context: string;

  @Prop({ default: '' })
  targetDepartment: string;

  @Prop({ default: false })
  requiresManagerApproval: boolean;

  @Prop({ type: [ActivitySkillRequirementSchema], default: [] })
  requiredSkills: ActivitySkillRequirement[];

  @Prop({ default: 0, min: 0 })
  seats: number;

  @Prop({ default: 'Draft', enum: ['Draft', 'Validated', 'In Progress', 'Completed'] })
  status: string;

  @Prop({ default: '' })
  startDate: string;

  @Prop({ default: '' })
  endDate: string;

  @Prop({ type: [ActivityEnrollmentSchema], default: [] })
  enrollments: ActivityEnrollment[];
}

export const ActivitySchema = SchemaFactory.createForClass(Activity);

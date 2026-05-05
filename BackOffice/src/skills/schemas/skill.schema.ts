import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SkillDocument = HydratedDocument<Skill>;

@Schema({ _id: false })
export class SkillAssignment {
  @Prop({ type: Types.ObjectId, required: true }) employeeId: Types.ObjectId;
  @Prop({ required: true }) employeeName: string;
  @Prop({ default: 1, min: 1, max: 5 }) level: number;
  @Prop({ default: '' }) notes: string;
  @Prop({ default: 0, min: 0 }) yearsOfExperience: number;
  @Prop({ default: '' }) certificateName: string;
  @Prop({ default: '' }) certificateUrl: string;
  @Prop({ default: '' }) evidenceNote: string;
  @Prop({ default: false }) validated: boolean;
  @Prop({ default: '' }) validatedBy: string;
}

export const SkillAssignmentSchema = SchemaFactory.createForClass(SkillAssignment);

@Schema({ timestamps: true })
export class Skill {
  @Prop({ required: true, trim: true, unique: true }) name: string;

  @Prop({ default: 'Know-How', enum: ['Knowledge', 'Know-How', 'Soft Skill'] })
  type: string;

  @Prop({ default: '' }) description: string;

  @Prop({ type: [SkillAssignmentSchema], default: [] }) assignments: SkillAssignment[];
}

export const SkillSchema = SchemaFactory.createForClass(Skill);

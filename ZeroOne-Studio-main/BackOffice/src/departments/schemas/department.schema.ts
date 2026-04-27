import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type DepartmentDocument = HydratedDocument<Department>;

@Schema({ _id: false })
export class DepartmentMember {
  @Prop({ type: Types.ObjectId, required: true })
  employeeId: Types.ObjectId;

  @Prop({ required: true })
  employeeName: string;

  @Prop({ default: '' })
  position: string;

  @Prop({ type: [String], default: [] })
  specializedSkills: string[];
}

export const DepartmentMemberSchema =
  SchemaFactory.createForClass(DepartmentMember);

@Schema({ timestamps: true })
export class Department {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ type: Types.ObjectId })
  managerId: Types.ObjectId;

  @Prop({ default: '' })
  managerName: string;

  @Prop({ type: [String], default: [] })
  skills: string[];

  @Prop({ type: [DepartmentMemberSchema], default: [] })
  members: DepartmentMember[];
}

export const DepartmentSchema = SchemaFactory.createForClass(Department);
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserRole = 'HR' | 'Manager' | 'Employee';

export type EmployeeDocument = HydratedDocument<Employee>;

@Schema({ _id: false })
export class EducationItem {
  @Prop({ default: '' }) degree: string;
  @Prop({ default: '' }) institution: string;
  @Prop({ default: '' }) fieldOfStudy: string;
  @Prop() startYear: number;
  @Prop() endYear: number;
  @Prop({ default: '' }) grade: string;
  @Prop({ default: '' }) description: string;
}

export const EducationItemSchema = SchemaFactory.createForClass(EducationItem);

@Schema({ _id: false })
export class CertificationItem {
  @Prop({ default: '' }) name: string;
  @Prop({ default: '' }) issuer: string;
  @Prop({ default: '' }) issueDate: string;
  @Prop({ default: '' }) expiryDate: string;
  @Prop({ default: '' }) credentialId: string;
  @Prop({ default: '' }) credentialUrl: string;
}

export const CertificationItemSchema = SchemaFactory.createForClass(CertificationItem);

export type EmploymentType = 'Full-time' | 'Part-time' | 'Contract' | 'Intern' | 'Freelance';
export type EmployeeStatus = 'Active' | 'Inactive' | 'On Leave' | 'Suspended' | 'Left Company';

@Schema({ timestamps: true })
export class Employee {
  @Prop({ required: true }) userId: string;
  @Prop({ required: true, trim: true }) fullName: string;
  @Prop({ required: true, unique: true, lowercase: true, trim: true }) email: string;
  @Prop({ required: true }) department: string;
  @Prop({ required: true }) position: string;
  @Prop({ default: '' }) location: string;
  @Prop({ default: 'Full-time', enum: ['Full-time', 'Part-time', 'Contract', 'Intern', 'Freelance'] })
  employmentType: EmploymentType;
  @Prop({ default: 'Active', enum: ['Active', 'Inactive', 'On Leave', 'Suspended', 'Left Company'] })
  status: EmployeeStatus;
  @Prop({ default: '' }) phone: string;
  @Prop({ default: '' }) joinedAt: string;
  @Prop({ default: 0 }) yearsOfExperience: number;
  @Prop({ default: '' }) bio: string;
  @Prop({ default: '' }) managerName: string;
  @Prop({ default: 0 }) skillsCount: number;
  @Prop({ default: 0 }) activitiesCount: number;
  @Prop({ type: [String], default: [] }) specializedSkills: string[];
  @Prop({ type: [EducationItemSchema], default: [] }) education: EducationItem[];
  @Prop({ type: [CertificationItemSchema], default: [] }) certifications: CertificationItem[];

  @Prop({ default: 'Employee', enum: ['HR', 'Manager', 'Employee'] })
  role: UserRole;
}

export const EmployeeSchema = SchemaFactory.createForClass(Employee);

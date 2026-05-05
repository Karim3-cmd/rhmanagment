import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;
export type UserRole = 'HR' | 'Manager' | 'Employee';

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  _id: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true, enum: ['HR', 'Manager', 'Employee'], default: 'Employee' })
  role: UserRole;

  @Prop({ default: '' })
  department: string;

  @Prop({ default: '' })
  jobTitle: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserSettingsDocument = HydratedDocument<UserSettings>;

@Schema({ timestamps: true })
export class UserSettings {
  @Prop({ type: Types.ObjectId, required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ default: 'en' })
  language: string;

  @Prop({ default: 'light' })
  theme: string;

  @Prop({ default: true })
  emailNotifications: boolean;

  @Prop({ default: true })
  pushNotifications: boolean;

  @Prop({ default: true })
  activityNotifications: boolean;

  @Prop({ default: true })
  recommendationNotifications: boolean;
}

export const UserSettingsSchema = SchemaFactory.createForClass(UserSettings);

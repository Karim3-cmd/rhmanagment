import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type RecommendationDocument = HydratedDocument<Recommendation>;

@Schema({ timestamps: true })
export class Recommendation {
  @Prop({ type: Types.ObjectId, required: true })
  employeeId: Types.ObjectId;

  @Prop({ required: true })
  employeeName: string;

  @Prop({ type: Types.ObjectId, required: true })
  activityId: Types.ObjectId;

  @Prop({ required: true })
  activityTitle: string;

  @Prop({ default: 0, min: 0, max: 100 })
  score: number;

  @Prop({ type: [String], default: [] })
  matchedSkills: string[];

  @Prop({ type: [String], default: [] })
  missingSkills: string[];

  @Prop({ default: '' })
  rationale: string;

  @Prop({ default: 'Open', enum: ['Open', 'Accepted', 'Dismissed'] })
  status: string;
}

export const RecommendationSchema = SchemaFactory.createForClass(Recommendation);

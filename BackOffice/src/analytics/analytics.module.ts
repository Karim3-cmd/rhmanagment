import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Activity, ActivitySchema } from '../activities/schemas/activity.schema';
import { Employee, EmployeeSchema } from '../employees/schemas/employee.schema';
import { Recommendation, RecommendationSchema } from '../recommendations/schemas/recommendation.schema';
import { Skill, SkillSchema } from '../skills/schemas/skill.schema';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Employee.name, schema: EmployeeSchema },
      { name: Skill.name, schema: SkillSchema },
      { name: Activity.name, schema: ActivitySchema },
      { name: Recommendation.name, schema: RecommendationSchema },
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}

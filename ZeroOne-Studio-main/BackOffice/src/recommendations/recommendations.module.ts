import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Activity, ActivitySchema } from '../activities/schemas/activity.schema';
import { Employee, EmployeeSchema } from '../employees/schemas/employee.schema';
import { Skill, SkillSchema } from '../skills/schemas/skill.schema';
import { Recommendation, RecommendationSchema } from './schemas/recommendation.schema';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationsService } from './recommendations.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Recommendation.name, schema: RecommendationSchema },
      { name: Employee.name, schema: EmployeeSchema },
      { name: Activity.name, schema: ActivitySchema },
      { name: Skill.name, schema: SkillSchema },
    ]),
  ],
  controllers: [RecommendationsController],
  providers: [RecommendationsService],
})
export class RecommendationsModule {}

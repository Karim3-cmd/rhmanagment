import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AIController } from './ai.controller';
import { GeminiService } from './gemini.service';
import { Employee, EmployeeSchema } from '../employees/schemas/employee.schema';
import { Skill, SkillSchema } from '../skills/schemas/skill.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Employee.name, schema: EmployeeSchema },
      { name: Skill.name, schema: SkillSchema },
    ]),
  ],
  controllers: [AIController],
  providers: [GeminiService],
  exports: [GeminiService],
})
export class AIModule {}

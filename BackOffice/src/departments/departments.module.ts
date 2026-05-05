import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DepartmentsController } from './departments.controller';
import { DepartmentsService } from './departments.service';
import { Department, DepartmentSchema } from './schemas/department.schema';
import { Employee, EmployeeSchema } from '../employees/schemas/employee.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Department.name, schema: DepartmentSchema },
      { name: Employee.name, schema: EmployeeSchema },
    ]),
  ],
  controllers: [DepartmentsController],
  providers: [DepartmentsService],
  exports: [DepartmentsService],
})
export class DepartmentsModule {}
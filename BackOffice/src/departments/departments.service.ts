import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Employee, EmployeeDocument } from '../employees/schemas/employee.schema';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import {
  Department,
  DepartmentDocument,
} from './schemas/department.schema';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectModel(Department.name)
    private readonly departmentModel: Model<DepartmentDocument>,
    @InjectModel(Employee.name)
    private readonly employeeModel: Model<EmployeeDocument>,
  ) {}

  private async syncMembers() {
    const departments = await this.departmentModel.find();
    const employees = await this.employeeModel.find().lean();

    for (const department of departments) {
      const deptMembers = employees
        .filter(
          (emp) =>
            emp.department?.toLowerCase().trim() ===
            department.name.toLowerCase().trim(),
        )
        .map((emp) => ({
          employeeId: emp._id,
          employeeName: emp.fullName,
          position: emp.position || '',
          specializedSkills: emp.specializedSkills || [],
        }));

      department.members = deptMembers as any;
      await department.save();
    }
  }

  private mapDepartment(department: DepartmentDocument) {
    const raw: any =
      'toObject' in department ? department.toObject() : department;
    return {
      ...raw,
      employeeCount: raw.members?.length || 0,
    };
  }

  async create(dto: CreateDepartmentDto) {
    const exists = await this.departmentModel.findOne({
      name: new RegExp(`^${dto.name}$`, 'i'),
    });
    if (exists) {
      throw new BadRequestException('Department already exists');
    }

    const created = await this.departmentModel.create({
      ...dto,
      description: dto.description || '',
    });

    await this.syncMembers();
    return this.mapDepartment(created);
  }

  async findAll() {
    await this.syncMembers();
    const items = await this.departmentModel.find().sort({ createdAt: -1 });
    return {
      total: items.length,
      items: items.map((item) => this.mapDepartment(item)),
    };
  }

  async findById(id: string) {
    await this.syncMembers();
    const department = await this.departmentModel.findById(id);
    if (!department) throw new NotFoundException('Department not found');
    return this.mapDepartment(department);
  }

  async update(id: string, dto: UpdateDepartmentDto) {
    const updated = await this.departmentModel.findByIdAndUpdate(
      id,
      dto,
      { new: true, runValidators: true },
    );
    if (!updated) throw new NotFoundException('Department not found');
    await this.syncMembers();
    return this.mapDepartment(updated);
  }

  async remove(id: string) {
    const deleted = await this.departmentModel.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundException('Department not found');
    return { message: 'Department deleted successfully' };
  }
}
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomBytes, scryptSync } from 'crypto';
import { Model } from 'mongoose';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { QueryEmployeesDto } from './dto/query-employees.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { Employee, EmployeeDocument } from './schemas/employee.schema';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectModel(Employee.name)
    private readonly employeeModel: Model<EmployeeDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  private hashPassword(password: string) {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
  }

  async create(dto: CreateEmployeeDto) {
    const exists = await this.employeeModel.findOne({
      email: dto.email.toLowerCase(),
    });
    if (exists) throw new BadRequestException('Employee email already exists');

    const normalizedEmail = dto.email.toLowerCase();

    const employee = await this.employeeModel.create({
      ...dto,
      email: normalizedEmail,
      education: dto.education || [],
      certifications: dto.certifications || [],
      joinedAt: dto.joinedAt || '',
    });

    // Automatically create corresponding login account for employee
    const userExists = await this.userModel.findOne({ email: normalizedEmail });
    if (!userExists) {
      const defaultPassword = this.hashPassword('password123');
      await this.userModel.create({
        name: dto.fullName,
        email: normalizedEmail,
        passwordHash: defaultPassword,
        role: 'Employee',
        department: dto.department || '',
        jobTitle: dto.position || '',
        isActive: true,
      });
    }

    return employee;
  }

  async findAll(query: QueryEmployeesDto) {
    const filter: Record<string, any> = {};
    if (query.search) {
      filter.$or = [
        { fullName: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } },
        { position: { $regex: query.search, $options: 'i' } },
        { department: { $regex: query.search, $options: 'i' } },
      ];
    }
    if (query.department && query.department !== 'All') {
      filter.department = query.department;
    }

    const items = await this.employeeModel.find(filter).sort({ createdAt: -1 });
    return { total: items.length, items };
  }

  async findById(id: string) {
    const employee = await this.employeeModel.findById(id);
    if (!employee) throw new NotFoundException('Employee not found');
    return employee;
  }

  async update(id: string, dto: UpdateEmployeeDto) {
    const previous = await this.employeeModel.findById(id);
    if (!previous) throw new NotFoundException('Employee not found');

    if (dto.email) {
      const exists = await this.employeeModel.findOne({
        _id: { $ne: id },
        email: dto.email.toLowerCase(),
      });
      if (exists) {
        throw new BadRequestException(
          'Another employee already uses this email',
        );
      }
      dto.email = dto.email.toLowerCase();
    }

    const employee = await this.employeeModel.findByIdAndUpdate(id, dto, {
      new: true,
      runValidators: true,
    });
    if (!employee) throw new NotFoundException('Employee not found');

    const previousEmail = previous.email.toLowerCase();
    const currentEmail = employee.email.toLowerCase();
    const existingUser = await this.userModel.findOne({ email: previousEmail });

    if (existingUser) {
      existingUser.name = employee.fullName;
      existingUser.email = currentEmail;
      existingUser.department = employee.department || '';
      existingUser.jobTitle = employee.position || '';
      await existingUser.save();
    } else {
      const defaultPassword = this.hashPassword('password123');
      await this.userModel.create({
        name: employee.fullName,
        email: currentEmail,
        passwordHash: defaultPassword,
        role: 'Employee',
        department: employee.department || '',
        jobTitle: employee.position || '',
        isActive: true,
      });
    }

    return employee;
  }

  async remove(id: string) {
    const employee = await this.employeeModel.findByIdAndDelete(id);
    if (!employee) throw new NotFoundException('Employee not found');
    return { message: 'Employee deleted successfully' };
  }
}

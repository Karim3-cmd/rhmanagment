import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { Employee } from './schemas/employee.schema';
import { User } from '../users/schemas/user.schema';

const mockEmployee = {
  _id: 'e1',
  fullName: 'John Doe',
  email: 'john@test.com',
  department: 'IT',
  position: 'Developer',
};

const mockEmployeeModel = {
  findOne: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
  create: jest.fn(),
};

const mockUserModel = {
  findOne: jest.fn(),
  create: jest.fn(),
};

describe('EmployeesService', () => {
  let service: EmployeesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeesService,
        { provide: getModelToken(Employee.name), useValue: mockEmployeeModel },
        { provide: getModelToken(User.name), useValue: mockUserModel },
      ],
    }).compile();

    service = module.get<EmployeesService>(EmployeesService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an employee successfully', async () => {
      mockEmployeeModel.findOne.mockResolvedValue(null);
      mockEmployeeModel.create.mockResolvedValue(mockEmployee);
      mockUserModel.findOne.mockResolvedValue(null);
      mockUserModel.create.mockResolvedValue({});

      const result = await service.create({
        fullName: 'John Doe',
        email: 'john@test.com',
        department: 'IT',
        position: 'Developer',
        userId: 'u1',
      });

      expect(result.fullName).toBe('John Doe');
    });

    it('should throw BadRequestException if email exists', async () => {
      mockEmployeeModel.findOne.mockResolvedValue(mockEmployee);

      await expect(
        service.create({
          fullName: 'John',
          email: 'john@test.com',
          department: 'IT',
          position: 'Dev',
          userId: 'u1',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should not create user if already exists', async () => {
      mockEmployeeModel.findOne.mockResolvedValue(null);
      mockEmployeeModel.create.mockResolvedValue(mockEmployee);
      mockUserModel.findOne.mockResolvedValue({ _id: 'u1' });

      await service.create({
        fullName: 'John',
        email: 'john@test.com',
        department: 'IT',
        position: 'Dev',
        userId: 'u1',
      });

      expect(mockUserModel.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all employees', async () => {
      mockEmployeeModel.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([mockEmployee]),
      });

      const result = await service.findAll({});
      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
    });

    it('should filter by search term', async () => {
      mockEmployeeModel.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([mockEmployee]),
      });

      const result = await service.findAll({ search: 'John' });
      expect(result.total).toBe(1);
    });

    it('should filter by department', async () => {
      mockEmployeeModel.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([mockEmployee]),
      });

      const result = await service.findAll({ department: 'IT' });
      expect(result.total).toBe(1);
    });
  });

  describe('findById', () => {
    it('should return employee by id', async () => {
      mockEmployeeModel.findById.mockResolvedValue(mockEmployee);

      const result = await service.findById('e1');
      expect(result.fullName).toBe('John Doe');
    });

    it('should throw NotFoundException if not found', async () => {
      mockEmployeeModel.findById.mockResolvedValue(null);

      await expect(service.findById('invalid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update an employee', async () => {
      const updatedEmployee = { ...mockEmployee, fullName: 'Jane Doe', save: jest.fn() };
      mockEmployeeModel.findById.mockResolvedValue(mockEmployee);
      mockEmployeeModel.findOne.mockResolvedValue(null);
      mockEmployeeModel.findByIdAndUpdate.mockResolvedValue(updatedEmployee);
      mockUserModel.findOne.mockResolvedValue({
        name: 'John',
        email: 'john@test.com',
        department: 'IT',
        jobTitle: 'Dev',
        save: jest.fn(),
      });

      const result = await service.update('e1', { fullName: 'Jane Doe' });
      expect(result.fullName).toBe('Jane Doe');
    });

    it('should throw NotFoundException if employee not found', async () => {
      mockEmployeeModel.findById.mockResolvedValue(null);

      await expect(service.update('invalid', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete an employee', async () => {
      mockEmployeeModel.findByIdAndDelete.mockResolvedValue(mockEmployee);

      const result = await service.remove('e1');
      expect(result.message).toBe('Employee deleted successfully');
    });

    it('should throw NotFoundException if not found', async () => {
      mockEmployeeModel.findByIdAndDelete.mockResolvedValue(null);

      await expect(service.remove('invalid')).rejects.toThrow(NotFoundException);
    });
  });
});

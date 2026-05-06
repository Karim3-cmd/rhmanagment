import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { Department } from './schemas/department.schema';
import { Employee } from '../employees/schemas/employee.schema';

const mockDept = {
  _id: 'd1',
  name: 'IT',
  description: 'Tech team',
  members: [],
  save: jest.fn().mockResolvedValue(true),
  toObject: jest.fn().mockReturnValue({ _id: 'd1', name: 'IT', description: 'Tech team', members: [] }),
};

const mockDepartmentModel = {
  findOne: jest.fn(),
  find: jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue([mockDept]) }),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
  create: jest.fn(),
};

const mockEmployeeModel = {
  find: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }),
};

describe('DepartmentsService', () => {
  let service: DepartmentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DepartmentsService,
        { provide: getModelToken(Department.name), useValue: mockDepartmentModel },
        { provide: getModelToken(Employee.name), useValue: mockEmployeeModel },
      ],
    }).compile();

    service = module.get<DepartmentsService>(DepartmentsService);
    jest.clearAllMocks();
    mockEmployeeModel.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });
    mockDepartmentModel.find.mockReturnValue({ sort: jest.fn().mockResolvedValue([mockDept]) });
  });

  describe('create', () => {
    it('should create a department successfully', async () => {
      mockDepartmentModel.findOne.mockResolvedValue(null);
      mockDepartmentModel.create.mockResolvedValue(mockDept);
      mockDepartmentModel.find.mockResolvedValue([mockDept]);

      const result = await service.create({ name: 'IT', description: 'Tech' });
      expect(result.name).toBe('IT');
    });

    it('should throw BadRequestException if department exists', async () => {
      mockDepartmentModel.findOne.mockResolvedValue(mockDept);

      await expect(service.create({ name: 'IT' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return all departments', async () => {
      mockDepartmentModel.find.mockResolvedValue([mockDept]);

      const result = await service.findAll();
      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
    });

    it('should return empty list when no departments', async () => {
      mockDepartmentModel.find.mockResolvedValue([]);

      const result = await service.findAll();
      expect(result.total).toBe(0);
    });
  });

  describe('findById', () => {
    it('should return a department by id', async () => {
      mockDepartmentModel.findById.mockResolvedValue(mockDept);

      const result = await service.findById('d1');
      expect(result.name).toBe('IT');
    });

    it('should throw NotFoundException if not found', async () => {
      mockDepartmentModel.findById.mockResolvedValue(null);

      await expect(service.findById('invalid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a department', async () => {
      mockDepartmentModel.findByIdAndUpdate.mockResolvedValue(mockDept);
      mockDepartmentModel.find.mockResolvedValue([mockDept]);

      const result = await service.update('d1', { name: 'IT Updated' });
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if department not found', async () => {
      mockDepartmentModel.findByIdAndUpdate.mockResolvedValue(null);

      await expect(service.update('invalid', { name: 'X' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a department', async () => {
      mockDepartmentModel.findByIdAndDelete.mockResolvedValue(mockDept);

      const result = await service.remove('d1');
      expect(result.message).toBe('Department deleted successfully');
    });

    it('should throw NotFoundException if not found', async () => {
      mockDepartmentModel.findByIdAndDelete.mockResolvedValue(null);

      await expect(service.remove('invalid')).rejects.toThrow(NotFoundException);
    });
  });
});

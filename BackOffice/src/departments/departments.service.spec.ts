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

// departmentModel.find() is called in two ways:
// 1. syncMembers(): await this.departmentModel.find() → needs to return array directly
// 2. findAll(): await this.departmentModel.find().sort(...) → needs .sort()
// Solution: return a real array with .sort() attached so it is iterable and chainable
const createFindMock = (items: any[]) => {
  const arr = [...items];
  return Object.assign(arr, {
    sort: jest.fn().mockResolvedValue(items),
  });
};

const mockDepartmentModel = {
  findOne: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
  create: jest.fn(),
};

const mockEmployeeModel = {
  find: jest.fn(),
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
    // Default: find returns array-like with .sort() support
    mockDepartmentModel.find.mockReturnValue(createFindMock([mockDept]));
    mockEmployeeModel.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });
  });

  describe('create', () => {
    it('should create a department successfully', async () => {
      mockDepartmentModel.findOne.mockResolvedValue(null);
      mockDepartmentModel.create.mockResolvedValue(mockDept);

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
      const result = await service.findAll();
      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
    });

    it('should return empty list when no departments', async () => {
      mockDepartmentModel.find.mockReturnValue(createFindMock([]));
      mockEmployeeModel.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });

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

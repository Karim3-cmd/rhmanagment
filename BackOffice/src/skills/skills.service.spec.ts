import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SkillsService } from './skills.service';
import { Skill } from './schemas/skill.schema';
import { Employee } from '../employees/schemas/employee.schema';

const mockSkill = {
  _id: 's1',
  name: 'React',
  description: 'Frontend library',
  assignments: [],
  save: jest.fn().mockResolvedValue(true),
  toObject: jest.fn().mockReturnValue({ _id: 's1', name: 'React', assignments: [] }),
};

const mockSkillModel = {
  findOne: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
  create: jest.fn(),
};

const mockEmployeeModel = {
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
};

describe('SkillsService', () => {
  let service: SkillsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SkillsService,
        { provide: getModelToken(Skill.name), useValue: mockSkillModel },
        { provide: getModelToken(Employee.name), useValue: mockEmployeeModel },
      ],
    }).compile();

    service = module.get<SkillsService>(SkillsService);
    jest.clearAllMocks();
    // Reset mocks AFTER clearAllMocks
    mockEmployeeModel.find.mockReturnValue({ select: jest.fn().mockResolvedValue([]) });
    mockSkillModel.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue([]),
      sort: jest.fn().mockResolvedValue([mockSkill]),
    });
  });

  describe('create', () => {
    it('should create a skill successfully', async () => {
      mockSkillModel.findOne.mockResolvedValue(null);
      mockSkillModel.create.mockResolvedValue(mockSkill);

      const result = await service.create({ name: 'React', type: 'Knowledge' });
      expect(result.name).toBe('React');
    });

    it('should throw BadRequestException if skill exists', async () => {
      mockSkillModel.findOne.mockResolvedValue(mockSkill);

      await expect(service.create({ name: 'React', type: 'Knowledge' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return all skills', async () => {
      mockSkillModel.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([mockSkill]),
      });

      const result = await service.findAll({});
      expect(result.total).toBe(1);
    });

    it('should filter by search', async () => {
      mockSkillModel.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([mockSkill]),
      });

      const result = await service.findAll({ search: 'React' });
      expect(result.total).toBe(1);
    });
  });

  describe('findById', () => {
    it('should return skill by id', async () => {
      mockSkillModel.findById.mockResolvedValue(mockSkill);

      const result = await service.findById('s1');
      expect(result.name).toBe('React');
    });

    it('should throw NotFoundException if not found', async () => {
      mockSkillModel.findById.mockResolvedValue(null);

      await expect(service.findById('invalid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a skill', async () => {
      mockSkillModel.findOne.mockResolvedValue(null);
      mockSkillModel.findByIdAndUpdate.mockResolvedValue({ ...mockSkill, name: 'Vue' });

      const result = await service.update('s1', { name: 'Vue' });
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if not found', async () => {
      mockSkillModel.findOne.mockResolvedValue(null);
      mockSkillModel.findByIdAndUpdate.mockResolvedValue(null);

      await expect(service.update('invalid', {})).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if name already exists', async () => {
      mockSkillModel.findOne.mockResolvedValue({ _id: 's2', name: 'Vue' });

      await expect(service.update('s1', { name: 'Vue' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should delete a skill', async () => {
      mockSkillModel.findByIdAndDelete.mockResolvedValue(mockSkill);
      mockSkillModel.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });

      const result = await service.remove('s1');
      expect(result.message).toBe('Skill deleted successfully');
    });

    it('should throw NotFoundException if not found', async () => {
      mockSkillModel.findByIdAndDelete.mockResolvedValue(null);

      await expect(service.remove('invalid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('assign', () => {
    it('should throw NotFoundException if skill not found', async () => {
      mockSkillModel.findById.mockResolvedValue(null);

      await expect(service.assign('invalid', { employeeId: 'e1' })).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if employee not found', async () => {
      mockSkillModel.findById.mockResolvedValue(mockSkill);
      mockEmployeeModel.findById.mockResolvedValue(null);

      await expect(service.assign('s1', { employeeId: 'invalid' })).rejects.toThrow(NotFoundException);
    });

    it('should assign skill to employee', async () => {
      const skillWithAssign = { ...mockSkill, assignments: [], save: jest.fn() };
      mockSkillModel.findById.mockResolvedValue(skillWithAssign);
      mockEmployeeModel.findById.mockResolvedValue({ _id: '507f1f77bcf86cd799439011', fullName: 'John' });

      const result = await service.assign('507f1f77bcf86cd799439011', { employeeId: '507f1f77bcf86cd799439011' });
      expect(result).toBeDefined();
    });
  });

  describe('unassign', () => {
    it('should throw NotFoundException if skill not found', async () => {
      mockSkillModel.findById.mockResolvedValue(null);

      await expect(service.unassign('invalid', 'e1')).rejects.toThrow(NotFoundException);
    });

    it('should unassign employee from skill', async () => {
      const skillWithAssign = {
        ...mockSkill,
        assignments: [{ employeeId: { toString: () => 'e1' } }],
      };
      mockSkillModel.findById.mockResolvedValue(skillWithAssign);

      const result = await service.unassign('s1', 'e1');
      expect(result).toBeDefined();
    });
  });
});

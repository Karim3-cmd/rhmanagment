import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './schemas/user.schema';

const mockUser = {
  _id: 'u1',
  name: 'John',
  email: 'john@test.com',
  role: 'Employee',
  passwordHash: 'hash',
  toObject: jest.fn().mockReturnValue({
    _id: 'u1',
    name: 'John',
    email: 'john@test.com',
    role: 'Employee',
    passwordHash: 'hash',
  }),
};

const mockUserModel = {
  find: jest.fn(),
  findById: jest.fn(),
  deleteMany: jest.fn(),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getModelToken(User.name), useValue: mockUserModel },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all users without passwordHash', async () => {
      mockUserModel.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([mockUser]),
      });

      const result = await service.findAll();
      expect(result.total).toBe(1);
      expect(result.items[0]).not.toHaveProperty('passwordHash');
    });

    it('should return empty list', async () => {
      mockUserModel.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      });

      const result = await service.findAll();
      expect(result.total).toBe(0);
    });
  });

  describe('findById', () => {
    it('should return user without passwordHash', async () => {
      mockUserModel.findById.mockResolvedValue(mockUser);

      const result = await service.findById('u1');
      expect(result).not.toHaveProperty('passwordHash');
      expect(result.name).toBe('John');
    });

    it('should throw NotFoundException if not found', async () => {
      mockUserModel.findById.mockResolvedValue(null);

      await expect(service.findById('invalid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteAll', () => {
    it('should delete all users', async () => {
      mockUserModel.deleteMany.mockResolvedValue({ deletedCount: 5 });

      const result = await service.deleteAll();
      expect(result.deleted).toBe(5);
    });
  });
});

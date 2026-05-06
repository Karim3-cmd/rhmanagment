import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/schemas/user.schema';
import { Employee } from '../employees/schemas/employee.schema';

const mockUser = {
  _id: 'user1',
  name: 'Test User',
  email: 'test@test.com',
  role: 'Employee',
  department: 'IT',
  passwordHash: '',
  save: jest.fn().mockResolvedValue(true),
  toObject: jest.fn().mockReturnValue({
    _id: 'user1',
    name: 'Test User',
    email: 'test@test.com',
    role: 'Employee',
    department: 'IT',
    passwordHash: 'hash',
  }),
};

const mockUserModel = {
  findOne: jest.fn(),
  create: jest.fn(),
};

const mockEmployeeModel = {
  findOne: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock-token'),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: getModelToken(Employee.name), useValue: mockEmployeeModel },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      mockUserModel.create.mockResolvedValue(mockUser);

      const result = await service.register({
        name: 'Test User',
        email: 'test@test.com',
        password: 'password123',
        role: 'Employee',
      });

      expect(result.message).toBe('Account created successfully');
      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: 'test@test.com' });
    });

    it('should throw BadRequestException if email already exists', async () => {
      mockUserModel.findOne.mockResolvedValue(mockUser);

      await expect(
        service.register({
          name: 'Test',
          email: 'test@test.com',
          password: 'pass',
          role: 'Employee',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should lowercase the email on register', async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      mockUserModel.create.mockResolvedValue(mockUser);

      await service.register({
        name: 'Test',
        email: 'TEST@TEST.COM',
        password: 'pass',
        role: 'Employee',
      });

      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: 'test@test.com' });
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      mockUserModel.findOne.mockResolvedValue(null);

      await expect(
        service.login({ email: 'notfound@test.com', password: 'pass' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is wrong', async () => {
      mockUserModel.findOne.mockResolvedValue({
        ...mockUser,
        passwordHash: 'invalidsalt:invalidhash',
      });

      await expect(
        service.login({ email: 'test@test.com', password: 'wrongpass' }),
      ).rejects.toThrow();
    });
  });
});

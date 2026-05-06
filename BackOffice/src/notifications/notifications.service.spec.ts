import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { Notification } from './schemas/notification.schema';

const mockNotification = {
  _id: 'n1',
  userId: 'u1',
  type: 'info',
  title: 'Test',
  message: 'Test message',
  category: 'System',
  read: false,
};

const mockNotificationModel = {
  countDocuments: jest.fn(),
  insertMany: jest.fn(),
  create: jest.fn(),
  find: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
  updateMany: jest.fn(),
};

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: getModelToken(Notification.name), useValue: mockNotificationModel },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    jest.clearAllMocks();
  });

  describe('seedForUser', () => {
    it('should seed notifications if none exist', async () => {
      mockNotificationModel.countDocuments.mockResolvedValue(0);
      mockNotificationModel.insertMany.mockResolvedValue([]);

      const result = await service.seedForUser('507f1f77bcf86cd799439011');
      expect(result.message).toBe('Demo notifications seeded');
      expect(mockNotificationModel.insertMany).toHaveBeenCalled();
    });

    it('should not seed if notifications already exist', async () => {
      mockNotificationModel.countDocuments.mockResolvedValue(2);

      const result = await service.seedForUser('507f1f77bcf86cd799439011');
      expect(result.message).toBe('Notifications already seeded');
      expect(mockNotificationModel.insertMany).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a notification', async () => {
      mockNotificationModel.create.mockResolvedValue(mockNotification);

      const result = await service.create({
        userId: '507f1f77bcf86cd799439011',
        type: 'info',
        title: 'Test',
        message: 'Test',
        category: 'System',
      });

      expect(result.title).toBe('Test');
    });
  });

  describe('findAll', () => {
    it('should return all notifications', async () => {
      mockNotificationModel.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([mockNotification]),
      });

      const result = await service.findAll({ userId: 'u1' });
      expect(result.total).toBe(1);
      expect(result.unread).toBe(1);
    });

    it('should filter unread notifications', async () => {
      mockNotificationModel.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([mockNotification]),
      });

      const result = await service.findAll({ userId: 'u1', filter: 'unread' });
      expect(result.total).toBe(1);
    });

    it('should filter by category', async () => {
      mockNotificationModel.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([mockNotification]),
      });

      const result = await service.findAll({ userId: 'u1', category: 'System' });
      expect(result.total).toBe(1);
    });
  });

  describe('markRead', () => {
    it('should mark notification as read', async () => {
      mockNotificationModel.findByIdAndUpdate.mockResolvedValue({ ...mockNotification, read: true });

      const result = await service.markRead('n1');
      expect(result.read).toBe(true);
    });

    it('should throw NotFoundException if not found', async () => {
      mockNotificationModel.findByIdAndUpdate.mockResolvedValue(null);

      await expect(service.markRead('invalid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('markAllRead', () => {
    it('should mark all notifications as read', async () => {
      mockNotificationModel.updateMany.mockResolvedValue({ modifiedCount: 2 });

      const result = await service.markAllRead('u1');
      expect(result.message).toBe('All notifications marked as read');
    });
  });

  describe('remove', () => {
    it('should delete a notification', async () => {
      mockNotificationModel.findByIdAndDelete.mockResolvedValue(mockNotification);

      const result = await service.remove('n1');
      expect(result.message).toBe('Notification deleted successfully');
    });

    it('should throw NotFoundException if not found', async () => {
      mockNotificationModel.findByIdAndDelete.mockResolvedValue(null);

      await expect(service.remove('invalid')).rejects.toThrow(NotFoundException);
    });
  });
});

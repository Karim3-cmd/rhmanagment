import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { Notification, NotificationDocument } from './schemas/notification.schema';

@Injectable()
export class NotificationsService {
  constructor(@InjectModel(Notification.name) private readonly notificationModel: Model<NotificationDocument>) {}

  async seedForUser(userId: string) {
    const count = await this.notificationModel.countDocuments({ userId });
    if (count > 0) return { message: 'Notifications already seeded' };

    await this.notificationModel.insertMany([
      { userId: new Types.ObjectId(userId), type: 'info', title: 'New Recommendation Available', message: 'A fresh set of activity recommendations is ready to review.', category: 'Recommendation' },
      { userId: new Types.ObjectId(userId), type: 'success', title: 'Profile Ready', message: 'Your account is connected to the live backend and MongoDB Atlas.', category: 'System' },
    ]);
    return { message: 'Demo notifications seeded' };
  }

  async create(dto: CreateNotificationDto) {
    return this.notificationModel.create({ ...dto, userId: new Types.ObjectId(dto.userId), link: dto.link || '' });
  }

  async findAll(query: QueryNotificationsDto) {
    const filter: Record<string, any> = {};
    if (query.userId) filter.userId = query.userId;
    if (query.filter === 'unread') filter.read = false;
    if (query.category && query.category !== 'All') filter.category = query.category;
    const items = await this.notificationModel.find(filter).sort({ createdAt: -1 });
    return { total: items.length, unread: items.filter((item) => !item.read).length, items };
  }

  async markRead(id: string) {
    const item = await this.notificationModel.findByIdAndUpdate(id, { read: true }, { new: true });
    if (!item) throw new NotFoundException('Notification not found');
    return item;
  }

  async markAllRead(userId: string) {
    await this.notificationModel.updateMany({ userId }, { read: true });
    return { message: 'All notifications marked as read' };
  }

  async remove(id: string) {
    const item = await this.notificationModel.findByIdAndDelete(id);
    if (!item) throw new NotFoundException('Notification not found');
    return { message: 'Notification deleted successfully' };
  }
}

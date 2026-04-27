import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  private sanitize(user: UserDocument) {
    const { passwordHash, ...safe } = user.toObject();
    return safe;
  }

  async findAll() {
    const users = await this.userModel.find().sort({ createdAt: -1 });
    return { total: users.length, items: users.map((user) => this.sanitize(user)) };
  }

  async findById(id: string) {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.sanitize(user);
  }

  async deleteAll() {
    const result = await this.userModel.deleteMany({});
    return { deleted: result.deletedCount };
  }
}

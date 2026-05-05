import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { UserSettings, UserSettingsDocument } from './schemas/user-settings.schema';

@Injectable()
export class SettingsService {
  constructor(@InjectModel(UserSettings.name) private readonly settingsModel: Model<UserSettingsDocument>) { }

  async getByUserId(userId: string) {
    return this.settingsModel.findOneAndUpdate(
      { userId },
      { $setOnInsert: { userId: new Types.ObjectId(userId) } },
      { upsert: true, new: true }
    );
  }

  async updateByUserId(userId: string, dto: UpdateSettingsDto) {
    return this.settingsModel.findOneAndUpdate(
      { userId },
      { $set: dto, $setOnInsert: { userId: new Types.ObjectId(userId) } },
      { upsert: true, new: true, runValidators: true },
    );
  }
}

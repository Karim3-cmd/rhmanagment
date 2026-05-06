import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { SettingsService } from './settings.service';
import { UserSettings } from './schemas/user-settings.schema';

const VALID_ID = '507f1f77bcf86cd799439011';

const mockSettings = {
  userId: VALID_ID,
  language: 'en',
  theme: 'light',
  emailNotifications: true,
  pushNotifications: true,
  activityNotifications: true,
  recommendationNotifications: true,
};

const mockSettingsModel = {
  findOneAndUpdate: jest.fn(),
};

describe('SettingsService', () => {
  let service: SettingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        { provide: getModelToken(UserSettings.name), useValue: mockSettingsModel },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
    jest.clearAllMocks();
  });

  describe('getByUserId', () => {
    it('should return settings for user', async () => {
      mockSettingsModel.findOneAndUpdate.mockResolvedValue(mockSettings);
      const result = await service.getByUserId(VALID_ID);
      expect(result.language).toBe('en');
    });

    it('should create default settings if not exist (upsert)', async () => {
      mockSettingsModel.findOneAndUpdate.mockResolvedValue({ ...mockSettings, userId: VALID_ID });
      const result = await service.getByUserId(VALID_ID);
      expect(result).toBeDefined();
    });
  });

  describe('updateByUserId', () => {
    it('should update settings', async () => {
      mockSettingsModel.findOneAndUpdate.mockResolvedValue({ ...mockSettings, theme: 'dark' });
      const result = await service.updateByUserId(VALID_ID, { theme: 'dark' });
      expect(result.theme).toBe('dark');
    });

    it('should update language', async () => {
      mockSettingsModel.findOneAndUpdate.mockResolvedValue({ ...mockSettings, language: 'fr' });
      const result = await service.updateByUserId(VALID_ID, { language: 'fr' });
      expect(result.language).toBe('fr');
    });

    it('should update notification preferences', async () => {
      mockSettingsModel.findOneAndUpdate.mockResolvedValue({ ...mockSettings, emailNotifications: false });
      const result = await service.updateByUserId(VALID_ID, { emailNotifications: false });
      expect(result.emailNotifications).toBe(false);
    });
  });
});

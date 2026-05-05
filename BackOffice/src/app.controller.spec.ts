import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('health', () => {
    it('returns the backend health payload', () => {
      const health = appController.getHealth();

      expect(health.ok).toBe(true);
      expect(health.service).toBe('HRBrain API');
      expect(new Date(health.timestamp).toString()).not.toBe('Invalid Date');
    });
  });

  describe('metrics', () => {
    it('returns Prometheus text metrics', () => {
      const metrics = appController.getMetrics();

      expect(metrics).toContain('hrbrain_api_up 1');
      expect(metrics).toContain('hrbrain_api_uptime_seconds');
      expect(metrics).toContain('hrbrain_api_memory_rss_bytes');
    });
  });
});

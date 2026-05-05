import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppController } from '../src/app.controller';
import { AppService } from '../src/app.service';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((response) => {
        expect(response.body.ok).toBe(true);
        expect(response.body.service).toBe('HRBrain API');
      });
  });

  it('/metrics (GET)', () => {
    return request(app.getHttpServer())
      .get('/metrics')
      .expect(200)
      .expect((response) => {
        expect(response.text).toContain('hrbrain_api_up 1');
      });
  });
});

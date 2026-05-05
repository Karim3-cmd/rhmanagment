import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ActivitiesModule } from './activities/activities.module';
import { DepartmentsModule } from './departments/departments.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AuthModule } from './auth/auth.module';
import { EmployeesModule } from './employees/employees.module';
import { NotificationsModule } from './notifications/notifications.module';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { SettingsModule } from './settings/settings.module';
import { SkillsModule } from './skills/skills.module';
import { UsersModule } from './users/users.module';
import { AIModule } from './ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
    }),
    AuthModule,
    UsersModule,
    EmployeesModule,
    SkillsModule,
    ActivitiesModule,
    DepartmentsModule,
    RecommendationsModule,
    AnalyticsModule,
    NotificationsModule,
    SettingsModule,
    AIModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional } from 'class-validator';

export class UpdateSettingsDto {
  @ApiPropertyOptional({ enum: ['en', 'fr'] })
  @IsOptional()
  @IsIn(['en', 'fr'])
  language?: 'en' | 'fr';

  @ApiPropertyOptional({ enum: ['light', 'dark'] })
  @IsOptional()
  @IsIn(['light', 'dark'])
  theme?: 'light' | 'dark';

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  pushNotifications?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  activityNotifications?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  recommendationNotifications?: boolean;
}

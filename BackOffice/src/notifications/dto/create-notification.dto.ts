import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsMongoId, IsOptional, IsString } from 'class-validator';

export class CreateNotificationDto {
  @ApiProperty()
  @IsMongoId()
  userId: string;

  @ApiProperty({ enum: ['success', 'warning', 'info', 'alert'] })
  @IsIn(['success', 'warning', 'info', 'alert'])
  type: 'success' | 'warning' | 'info' | 'alert';

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  message: string;

  @ApiProperty({ enum: ['Recommendation', 'Activity', 'Skill', 'System'] })
  @IsIn(['Recommendation', 'Activity', 'Skill', 'System'])
  category: 'Recommendation' | 'Activity' | 'Skill' | 'System';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  link?: string;
}

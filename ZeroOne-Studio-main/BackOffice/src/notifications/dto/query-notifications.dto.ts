import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsMongoId, IsOptional } from 'class-validator';

export class QueryNotificationsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  userId?: string;

  @ApiPropertyOptional({ enum: ['all', 'unread'] })
  @IsOptional()
  @IsIn(['all', 'unread'])
  filter?: 'all' | 'unread';

  @ApiPropertyOptional({ enum: ['All', 'Recommendation', 'Activity', 'Skill', 'System'] })
  @IsOptional()
  @IsIn(['All', 'Recommendation', 'Activity', 'Skill', 'System'])
  category?: 'All' | 'Recommendation' | 'Activity' | 'Skill' | 'System';
}

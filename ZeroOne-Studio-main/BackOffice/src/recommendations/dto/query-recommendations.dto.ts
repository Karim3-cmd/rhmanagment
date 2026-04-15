import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class QueryRecommendationsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  skill?: string;

  @ApiPropertyOptional({ enum: ['All', 'Open', 'Accepted', 'Dismissed'] })
  @IsOptional()
  @IsIn(['All', 'Open', 'Accepted', 'Dismissed'])
  status?: 'All' | 'Open' | 'Accepted' | 'Dismissed';

  @ApiPropertyOptional({ enum: ['All', 'Strong', 'Good', 'Partial'] })
  @IsOptional()
  @IsIn(['All', 'Strong', 'Good', 'Partial'])
  matchLevel?: 'All' | 'Strong' | 'Good' | 'Partial';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  activityId?: string;
}

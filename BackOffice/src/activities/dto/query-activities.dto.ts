import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBooleanString, IsIn, IsOptional, IsString } from 'class-validator';

export class QueryActivitiesDto {
  @ApiPropertyOptional({ example: 'react' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['All', 'Upskilling', 'Expertise', 'Development'] })
  @IsOptional()
  @IsIn(['All', 'Upskilling', 'Expertise', 'Development'])
  context?: 'All' | 'Upskilling' | 'Expertise' | 'Development';

  @ApiPropertyOptional({ enum: ['All', 'Draft', 'Validated', 'In Progress', 'Completed'] })
  @IsOptional()
  @IsIn(['All', 'Draft', 'Validated', 'In Progress', 'Completed'])
  status?: 'All' | 'Draft' | 'Validated' | 'In Progress' | 'Completed';

  @ApiPropertyOptional({ example: 'Engineering' })
  @IsOptional()
  @IsString()
  targetDepartment?: string;

  @ApiPropertyOptional({ example: '65f1c2...' })
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiPropertyOptional({ example: 'true' })
  @IsOptional()
  @IsBooleanString()
  onlyMine?: string;
}

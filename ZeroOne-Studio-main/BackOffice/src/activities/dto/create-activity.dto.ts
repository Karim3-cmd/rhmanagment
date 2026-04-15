import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ActivitySkillRequirementDto {
  @ApiProperty({ example: 'React' })
  @IsString()
  name: string;

  @ApiProperty({ example: 3, minimum: 1, maximum: 4 })
  @IsInt()
  @Min(1)
  @Max(4)
  level: number;
}

export class CreateActivityDto {
  @ApiProperty({ example: 'Advanced React Patterns' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Master advanced React concepts and design patterns.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ['Upskilling', 'Expertise', 'Development'] })
  @IsIn(['Upskilling', 'Expertise', 'Development'])
  context: 'Upskilling' | 'Expertise' | 'Development';

  @ApiPropertyOptional({ example: 'Engineering' })
  @IsOptional()
  @IsString()
  targetDepartment?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  requiresManagerApproval?: boolean;

  @ApiPropertyOptional({ type: [ActivitySkillRequirementDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => ActivitySkillRequirementDto)
  requiredSkills?: ActivitySkillRequirementDto[];

  @ApiProperty({ example: 20 })
  @IsInt()
  @Min(0)
  seats: number;

  @ApiPropertyOptional({ enum: ['Draft', 'Validated', 'In Progress', 'Completed'] })
  @IsOptional()
  @IsIn(['Draft', 'Validated', 'In Progress', 'Completed'])
  status?: 'Draft' | 'Validated' | 'In Progress' | 'Completed';

  @ApiPropertyOptional({ example: '2026-04-01' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-06-01' })
  @IsOptional()
  @IsString()
  endDate?: string;
}

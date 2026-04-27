import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
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

  @ApiProperty({ example: 3, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  level: number;
}

export class CreateActivityDto {
  @ApiProperty({ example: 'Advanced React Patterns' })
  @IsString()
  title: string;

  @ApiPropertyOptional({
    example: 'Master advanced React concepts and design patterns.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    enum: ['Upskilling', 'Expertise', 'Development'],
    example: 'Upskilling',
  })
  @IsIn(['Upskilling', 'Expertise', 'Development'])
  context: 'Upskilling' | 'Expertise' | 'Development' = 'Upskilling';

  @ApiPropertyOptional({ example: 'Engineering' })
  @IsOptional()
  @IsString()
  targetDepartment?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  requiresManagerApproval?: boolean;

  @ApiPropertyOptional({
    type: [ActivitySkillRequirementDto],
    minItems: 0,
    example: [],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => ActivitySkillRequirementDto)
  requiredSkills?: ActivitySkillRequirementDto[];

  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(0)
  seats: number = 10;

  @ApiPropertyOptional({
    enum: ['Draft', 'Validated', 'In Progress', 'Completed'],
    example: 'Draft',
  })
  @IsOptional()
  @IsIn(['Draft', 'Validated', 'In Progress', 'Completed'])
  status?: 'Draft' | 'Validated' | 'In Progress' | 'Completed';

  @ApiPropertyOptional({ example: '2026-04-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-06-01' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

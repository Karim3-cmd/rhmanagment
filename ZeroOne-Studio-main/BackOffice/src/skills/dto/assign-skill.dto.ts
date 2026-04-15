import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class AssignSkillDto {
  @ApiProperty()
  @IsString()
  employeeId: string;

  @ApiProperty({ minimum: 1, maximum: 4 })
  @IsInt()
  @Min(1)
  @Max(4)
  level: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsInt()
  @Min(0)
  yearsOfExperience?: number;

  @ApiPropertyOptional({ example: 'AWS Solutions Architect Associate' })
  @IsOptional()
  @IsString()
  certificateName?: string;

  @ApiPropertyOptional({ example: 'https://example.com/certs/aws-123' })
  @IsOptional()
  @IsString()
  certificateUrl?: string;

  @ApiPropertyOptional({ example: 'Worked on 2 production migrations and attached proof.' })
  @IsOptional()
  @IsString()
  evidenceNote?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  validated?: boolean;

  @ApiPropertyOptional({ example: 'Manager Karim' })
  @IsOptional()
  @IsString()
  validatedBy?: string;
}

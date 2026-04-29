import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEmail,
  IsIn,
  Matches,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class EducationItemDto {
  @ApiPropertyOptional() @IsOptional() @IsString() degree?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() institution?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() fieldOfStudy?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() startYear?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() endYear?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() grade?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
}

export class CertificationItemDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() issuer?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() issueDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() expiryDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() credentialId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() credentialUrl?: string;
}

export class CreateEmployeeDto {
  @ApiProperty({ description: 'User ID reference' })
  @IsString()
  userId: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  fullName: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Engineering' })
  @IsString()
  department: string;

  @ApiProperty({ example: 'Senior Developer' })
  @IsString()
  position: string;

  @ApiPropertyOptional({ example: 'Tunis' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: 'Full-time', enum: ['Full-time', 'Part-time', 'Contract', 'Intern', 'Freelance'] })
  @IsOptional()
  @IsIn(['Full-time', 'Part-time', 'Contract', 'Intern', 'Freelance'])
  employmentType?: string;

  @ApiPropertyOptional({ example: 'Active', enum: ['Active', 'Inactive', 'On Leave', 'Suspended', 'Left Company'] })
  @IsOptional()
  @IsIn(['Active', 'Inactive', 'On Leave', 'Suspended', 'Left Company'])
  status?: string;

  @ApiPropertyOptional({ example: '+21698765432' })
  @IsOptional()
  @Matches(/^\+216\d{8}$/, { message: 'Phone must start with +216 followed by 8 digits' })
  phone?: string;

  @ApiPropertyOptional({ example: '2024-01-15' })
  @IsOptional()
  @IsDateString()
  joinedAt?: string;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsNumber()
  yearsOfExperience?: number;

  @ApiPropertyOptional({ example: 'Experienced developer...' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() managerName?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() skillsCount?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() activitiesCount?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specializedSkills?: string[];

  @ApiPropertyOptional({ type: [EducationItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EducationItemDto)
  education?: EducationItemDto[];

  @ApiPropertyOptional({ type: [CertificationItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CertificationItemDto)
  certifications?: CertificationItemDto[];

  @ApiPropertyOptional({ example: 'Employee', enum: ['HR', 'Manager', 'Employee'] })
  @IsOptional()
  @IsIn(['HR', 'Manager', 'Employee'])
  role?: string;
}

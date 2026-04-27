import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEmail,
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
  @ApiProperty() @IsString() fullName: string;
  @ApiProperty() @IsEmail() email: string;
  @ApiPropertyOptional({ example: '22587469' })
  @IsOptional()
  @Matches(/^\d{8}$/, { message: 'phone must contain exactly 8 digits' })
  phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() department?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() position?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() location?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() employmentType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() managerName?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() yearsOfExperience?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() skillsCount?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() activitiesCount?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() bio?: string;
  @ApiPropertyOptional({ example: '2026-04-21' })
  @IsOptional()
  @IsDateString()
  joinedAt?: string;
  @ApiProperty({ type: [String], minItems: 1 })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  specializedSkills: string[];
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
  @IsString()
  role?: string;
}

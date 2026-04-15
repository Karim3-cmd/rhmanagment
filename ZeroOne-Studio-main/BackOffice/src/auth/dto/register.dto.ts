import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Karim B.' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'karim@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Secure12345' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Employee', enum: ['HR', 'Manager', 'Employee'] })
  @IsIn(['HR', 'Manager', 'Employee'])
  role: 'HR' | 'Manager' | 'Employee';

  @ApiPropertyOptional({ example: 'Engineering' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ example: 'Senior Developer' })
  @IsOptional()
  @IsString()
  jobTitle?: string;
}

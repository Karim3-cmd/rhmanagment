import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateDepartmentDto {
  @ApiProperty({ example: 'Engineering' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Software development team' })
  @IsOptional()
  @IsString()
  description?: string;
}
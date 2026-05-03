import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';

export class QueryDepartmentsDto {
  @ApiPropertyOptional({ description: 'Page number (starts at 1)', example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', example: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}

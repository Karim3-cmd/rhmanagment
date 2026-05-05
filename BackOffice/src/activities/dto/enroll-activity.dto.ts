import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsOptional, IsString } from 'class-validator';

export class EnrollActivityDto {
  @ApiProperty()
  @IsMongoId()
  employeeId: string;

  @ApiPropertyOptional({ example: 'Recommended by HR for the next quarter.' })
  @IsOptional()
  @IsString()
  notes?: string;
}

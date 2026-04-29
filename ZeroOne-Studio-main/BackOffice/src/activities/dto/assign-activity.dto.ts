import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsOptional, IsString } from 'class-validator';

export class AssignActivityDto {
  @ApiProperty()
  @IsMongoId()
  employeeId: string;

  @ApiPropertyOptional({ example: 'Assigned by HR based on skills match.' })
  @IsOptional()
  @IsString()
  notes?: string;
}

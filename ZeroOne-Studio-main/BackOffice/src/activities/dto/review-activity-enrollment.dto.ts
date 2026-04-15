import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class ReviewActivityEnrollmentDto {
  @ApiProperty({ enum: ['Approved', 'Rejected'] })
  @IsIn(['Approved', 'Rejected'])
  decision: 'Approved' | 'Rejected';

  @ApiPropertyOptional({ example: 'Validated by department manager.' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ example: 'Karim Ben Salah' })
  @IsOptional()
  @IsString()
  reviewedBy?: string;
}

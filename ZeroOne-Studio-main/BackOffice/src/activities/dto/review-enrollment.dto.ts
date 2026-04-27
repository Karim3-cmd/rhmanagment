import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class ReviewEnrollmentDto {
  @ApiProperty({ enum: ['approved', 'rejected'], example: 'approved' })
  @IsIn(['approved', 'rejected'])
  decision: 'approved' | 'rejected';

  @ApiPropertyOptional({ example: 'Good fit for this training' })
  @IsOptional()
  @IsString()
  reviewNote?: string;

  @ApiPropertyOptional({ example: 25, minimum: 0, maximum: 100 })
  @IsOptional()
  progressWeight?: number;
}

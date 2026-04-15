import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class UpdateRecommendationStatusDto {
  @ApiProperty({ enum: ['Open', 'Accepted', 'Dismissed'] })
  @IsIn(['Open', 'Accepted', 'Dismissed'])
  status: 'Open' | 'Accepted' | 'Dismissed';
}

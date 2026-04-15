import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';

export class CreateSkillDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty({ enum: ['Knowledge', 'Know-How', 'Soft Skill'] }) @IsIn(['Knowledge', 'Know-How', 'Soft Skill']) type: string;
  @ApiPropertyOptional() @IsOptional() @IsString() category?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() trending?: boolean;
}

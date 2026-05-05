import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateSkillDto {
  @ApiProperty({ example: 'React' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'JavaScript framework for building UIs' })
  @IsOptional()
  @IsString()
  description?: string;
}

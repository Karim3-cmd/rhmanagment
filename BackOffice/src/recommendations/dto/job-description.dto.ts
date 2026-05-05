import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class JobDescriptionDto {
  @ApiProperty({
    example: 'Need a senior backend developer with Node.js and Kafka experience for scalable microservices.',
    description: 'Free-text job description to analyze',
  })
  @IsString()
  jobDescription: string;

  @ApiPropertyOptional({
    example: 'Engineering',
    description: 'Optional department filter',
  })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({
    example: 3,
    description: 'Minimum years of experience required',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  minYearsExperience?: number;
}

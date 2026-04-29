import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JobDescriptionDto } from './dto/job-description.dto';
import { QueryRecommendationsDto } from './dto/query-recommendations.dto';
import { UpdateRecommendationStatusDto } from './dto/update-recommendation-status.dto';
import { RecommendationsService } from './recommendations.service';

@ApiTags('recommendations')
@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Get()
  @ApiOperation({ summary: 'List recommendations' })
  findAll(@Query() query: QueryRecommendationsDto) {
    return this.recommendationsService.findAll(query);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Recompute recommendations from employees, skills and activities' })
  refresh() {
    return this.recommendationsService.refresh();
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update recommendation status' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateRecommendationStatusDto) {
    return this.recommendationsService.updateStatus(id, dto);
  }

  @Post('job-match')
  @ApiOperation({ summary: 'Match employees to job description using AI' })
  matchJobDescription(@Body() dto: JobDescriptionDto) {
    return this.recommendationsService.matchJobDescription(dto);
  }
}

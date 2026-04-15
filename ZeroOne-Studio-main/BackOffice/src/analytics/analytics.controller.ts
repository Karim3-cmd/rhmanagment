import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard analytics' })
  getDashboard() {
    return this.analyticsService.getDashboard();
  }

  @Get('employee/:employeeId')
  @ApiOperation({ summary: 'Get one employee evolution analytics' })
  getEmployeeEvolution(@Param('employeeId') employeeId: string) {
    return this.analyticsService.getEmployeeEvolution(employeeId);
  }
}

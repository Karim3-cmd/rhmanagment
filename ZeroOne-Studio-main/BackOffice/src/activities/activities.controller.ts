import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { EnrollActivityDto } from './dto/enroll-activity.dto';
import { QueryActivitiesDto } from './dto/query-activities.dto';
import { ReviewActivityEnrollmentDto } from './dto/review-activity-enrollment.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { UpdateActivityProgressDto } from './dto/update-activity-progress.dto';

@ApiTags('activities')
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  @ApiOperation({ summary: 'Create an activity' })
  create(@Body() dto: CreateActivityDto) {
    return this.activitiesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List activities' })
  findAll(@Query() query: QueryActivitiesDto) {
    return this.activitiesService.findAll(query);
  }

  @Get('my/:employeeId')
  @ApiOperation({ summary: 'List activities assigned to one employee' })
  findMine(@Param('employeeId') employeeId: string) {
    return this.activitiesService.getMyActivities(employeeId);
  }

  @Get(':id/candidates')
  @ApiOperation({ summary: 'Get top recommended candidates for one activity' })
  getCandidates(@Param('id') id: string) {
    return this.activitiesService.getCandidates(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get activity by id' })
  findById(@Param('id') id: string) {
    return this.activitiesService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an activity' })
  update(@Param('id') id: string, @Body() dto: UpdateActivityDto) {
    return this.activitiesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an activity' })
  remove(@Param('id') id: string) {
    return this.activitiesService.remove(id);
  }

  @Post(':id/enroll')
  @ApiOperation({ summary: 'Enroll an employee into an activity' })
  enroll(@Param('id') id: string, @Body() dto: EnrollActivityDto) {
    return this.activitiesService.enroll(id, dto);
  }

  @Patch(':id/review/:employeeId')
  @ApiOperation({ summary: 'Manager approves or rejects one enrollment' })
  review(
    @Param('id') id: string,
    @Param('employeeId') employeeId: string,
    @Body() dto: ReviewActivityEnrollmentDto,
  ) {
    return this.activitiesService.reviewEnrollment(id, employeeId, dto);
  }

  @Patch(':id/progress/:employeeId')
  @ApiOperation({ summary: 'Employee updates activity progress and proof' })
  updateProgress(
    @Param('id') id: string,
    @Param('employeeId') employeeId: string,
    @Body() dto: UpdateActivityProgressDto,
  ) {
    return this.activitiesService.updateProgress(id, employeeId, dto);
  }

  @Post(':id/proofs/:employeeId')
  @ApiOperation({ summary: 'Employee submits a proof for an activity' })
  submitProof(
    @Param('id') id: string,
    @Param('employeeId') employeeId: string,
    @Body() proofData: { title: string; type: string; url: string; note: string },
  ) {
    return this.activitiesService.submitProof(id, employeeId, proofData);
  }

  @Patch(':id/proofs/:employeeId/:proofIndex')
  @ApiOperation({ summary: 'Manager reviews (approves/rejects) a proof' })
  reviewProof(
    @Param('id') id: string,
    @Param('employeeId') employeeId: string,
    @Param('proofIndex') proofIndex: string,
    @Body() reviewData: { decision: 'approved' | 'rejected'; reviewNote: string; reviewedBy: string; progressWeight?: number },
  ) {
    return this.activitiesService.reviewProof(id, employeeId, Number(proofIndex), reviewData);
  }

  @Delete(':id/enroll/:employeeId')
  @ApiOperation({ summary: 'Remove an enrollment from an activity' })
  unenroll(@Param('id') id: string, @Param('employeeId') employeeId: string) {
    return this.activitiesService.unenroll(id, employeeId);
  }
}

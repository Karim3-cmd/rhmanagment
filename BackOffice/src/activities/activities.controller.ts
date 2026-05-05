import { Body, Controller, Delete, Get, Param, Patch, Post, Query, ForbiddenException, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ActivitiesService } from './activities.service';
import { AssignActivityDto } from './dto/assign-activity.dto';
import { CreateActivityDto } from './dto/create-activity.dto';
import { EnrollActivityDto } from './dto/enroll-activity.dto';
import { QueryActivitiesDto } from './dto/query-activities.dto';
import { ReviewActivityEnrollmentDto } from './dto/review-activity-enrollment.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { UpdateActivityProgressDto } from './dto/update-activity-progress.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUserData } from '../auth/current-user.decorator';

@ApiTags('activities')
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) { }

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
  @ApiOperation({ summary: 'Enroll an employee into an activity (self-enrollment)' })
  enroll(@Param('id') id: string, @Body() dto: EnrollActivityDto) {
    return this.activitiesService.enroll(id, dto);
  }

  @Post(':id/assign')
  @ApiOperation({ summary: 'HR assigns an employee to an activity (requires manager approval)' })
  assign(@Param('id') id: string, @Body() dto: AssignActivityDto) {
    return this.activitiesService.assign(id, dto);
  }

  @Get('pending-approvals/:managerId')
  @ApiOperation({ summary: 'Get pending approvals for a manager' })
  getPendingApprovals(@Param('managerId') managerId: string) {
    return this.activitiesService.getPendingApprovals(managerId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/approve/:employeeId')
  @ApiOperation({ summary: 'Manager approves an enrollment' })
  async approve(
    @Param('id') id: string,
    @Param('employeeId') employeeId: string,
    @Body() dto: { reviewedBy: string; reviewNote?: string; progressWeight?: number },
    @CurrentUser() user: CurrentUserData,
  ) {
    if (user.role !== 'Manager' && user.role !== 'HR') {
      throw new ForbiddenException('Only managers can approve enrollments');
    }
    return this.activitiesService.approveEnrollment(id, employeeId, dto.reviewedBy, dto.reviewNote, dto.progressWeight, user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/reject/:employeeId')
  @ApiOperation({ summary: 'Manager rejects an enrollment' })
  async reject(
    @Param('id') id: string,
    @Param('employeeId') employeeId: string,
    @Body() dto: { reviewedBy: string; reviewNote?: string },
    @CurrentUser() user: CurrentUserData,
  ) {
    if (user.role !== 'Manager' && user.role !== 'HR') {
      throw new ForbiddenException('Only managers can reject enrollments');
    }
    return this.activitiesService.rejectEnrollment(id, employeeId, dto.reviewedBy, dto.reviewNote, user.userId);
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

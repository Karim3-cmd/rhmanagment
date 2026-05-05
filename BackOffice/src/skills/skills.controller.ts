import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AssignSkillDto } from './dto/assign-skill.dto';
import { CreateSkillDto } from './dto/create-skill.dto';
import { QuerySkillsDto } from './dto/query-skills.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { SkillsService } from './skills.service';

@ApiTags('skills')
@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Post()
  @ApiOperation({ summary: 'Create skill' })
  create(@Body() dto: CreateSkillDto) {
    return this.skillsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List skills' })
  findAll(@Query() query: QuerySkillsDto) {
    return this.skillsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get skill by id' })
  findById(@Param('id') id: string) {
    return this.skillsService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update skill' })
  update(@Param('id') id: string, @Body() dto: UpdateSkillDto) {
    return this.skillsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete skill' })
  remove(@Param('id') id: string) {
    return this.skillsService.remove(id);
  }

  @Post(':id/assign')
  @ApiOperation({ summary: 'Assign skill to employee' })
  assign(@Param('id') id: string, @Body() dto: AssignSkillDto) {
    return this.skillsService.assign(id, dto);
  }

  @Delete(':id/assign/:employeeId')
  @ApiOperation({ summary: 'Unassign skill from employee' })
  unassign(@Param('id') id: string, @Param('employeeId') employeeId: string) {
    return this.skillsService.unassign(id, employeeId);
  }
}

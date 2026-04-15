import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Employee, EmployeeDocument } from '../employees/schemas/employee.schema';
import { AssignSkillDto } from './dto/assign-skill.dto';
import { CreateSkillDto } from './dto/create-skill.dto';
import { QuerySkillsDto } from './dto/query-skills.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { Skill, SkillDocument } from './schemas/skill.schema';

@Injectable()
export class SkillsService {
  constructor(
    @InjectModel(Skill.name)
    private readonly skillModel: Model<SkillDocument>,
    @InjectModel(Employee.name)
    private readonly employeeModel: Model<EmployeeDocument>,
  ) {}

  private mapSkill(skill: any) {
    const assignments = skill.assignments || [];
    const averageLevel = assignments.length
      ? Number(
          (
            assignments.reduce((s: number, a: any) => s + a.level, 0) /
            assignments.length
          ).toFixed(1),
        )
      : 0;

    return {
      ...(skill.toObject?.() ?? skill),
      employeeCount: assignments.length,
      averageLevel,
    };
  }

  private async syncEmployeeSkillCounts() {
    const skills = await this.skillModel.find().lean();
    const countMap = new Map<string, number>();

    for (const skill of skills) {
      const seen = new Set<string>();

      for (const assignment of skill.assignments || []) {
        const id = String(assignment.employeeId);

        if (seen.has(id)) continue;

        seen.add(id);
        countMap.set(id, (countMap.get(id) || 0) + 1);
      }
    }

    const employees = await this.employeeModel.find().select('_id');

    await Promise.all(
      employees.map((employee) =>
        this.employeeModel.findByIdAndUpdate(employee._id, {
          skillsCount: countMap.get(employee._id.toString()) || 0,
        }),
      ),
    );
  }

  async create(dto: CreateSkillDto) {
    const exists = await this.skillModel.findOne({
      name: new RegExp(`^${dto.name}$`, 'i'),
    });

    if (exists) {
      throw new BadRequestException('A skill with this name already exists');
    }

    return this.mapSkill(
      await this.skillModel.create({
        ...dto,
        description: dto.description || '',
        trending: dto.trending || false,
      }),
    );
  }

  async findAll(query: QuerySkillsDto) {
    const filter: Record<string, any> = {};

    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { category: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
      ];
    }

    if (query.type && query.type !== 'All') {
      filter.type = query.type;
    }

    const items = await this.skillModel.find(filter).sort({ createdAt: -1 });

    return {
      total: items.length,
      items: items.map((item) => this.mapSkill(item)),
    };
  }

  async findById(id: string) {
    const skill = await this.skillModel.findById(id);

    if (!skill) {
      throw new NotFoundException('Skill not found');
    }

    return this.mapSkill(skill);
  }

  async update(id: string, dto: UpdateSkillDto) {
    if (dto.name) {
      const exists = await this.skillModel.findOne({
        _id: { $ne: id },
        name: new RegExp(`^${dto.name}$`, 'i'),
      });

      if (exists) {
        throw new BadRequestException(
          'Another skill with this name already exists',
        );
      }
    }

    const skill = await this.skillModel.findByIdAndUpdate(id, dto, {
      new: true,
      runValidators: true,
    });

    if (!skill) {
      throw new NotFoundException('Skill not found');
    }

    return this.mapSkill(skill);
  }

  async remove(id: string) {
    const skill = await this.skillModel.findByIdAndDelete(id);

    if (!skill) {
      throw new NotFoundException('Skill not found');
    }

    await this.syncEmployeeSkillCounts();

    return { message: 'Skill deleted successfully' };
  }

  async assign(skillId: string, dto: AssignSkillDto) {
    const skill = await this.skillModel.findById(skillId);

    if (!skill) {
      throw new NotFoundException('Skill not found');
    }

    const employee = await this.employeeModel.findById(dto.employeeId);

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const existing = skill.assignments.find(
      (item) => item.employeeId.toString() === dto.employeeId,
    );

    if (existing) {
      existing.level = dto.level;
      existing.notes = dto.notes || '';
      existing.employeeName = employee.fullName;
      existing.yearsOfExperience = dto.yearsOfExperience || 0;
      existing.certificateName = dto.certificateName || '';
      existing.certificateUrl = dto.certificateUrl || '';
      existing.evidenceNote = dto.evidenceNote || '';
      existing.validated = dto.validated || false;
      existing.validatedBy = dto.validatedBy || '';
    } else {
      skill.assignments.push({
        employeeId: new Types.ObjectId(dto.employeeId),
        employeeName: employee.fullName,
        level: dto.level,
        notes: dto.notes || '',
        yearsOfExperience: dto.yearsOfExperience || 0,
        certificateName: dto.certificateName || '',
        certificateUrl: dto.certificateUrl || '',
        evidenceNote: dto.evidenceNote || '',
        validated: dto.validated || false,
        validatedBy: dto.validatedBy || '',
      } as any);
    }

    await skill.save();
    await this.syncEmployeeSkillCounts();

    return this.mapSkill(skill);
  }

  async unassign(skillId: string, employeeId: string) {
    const skill = await this.skillModel.findById(skillId);

    if (!skill) {
      throw new NotFoundException('Skill not found');
    }

    skill.assignments = skill.assignments.filter(
      (item) => item.employeeId.toString() !== employeeId,
    ) as any;

    await skill.save();
    await this.syncEmployeeSkillCounts();

    return this.mapSkill(skill);
  }
}

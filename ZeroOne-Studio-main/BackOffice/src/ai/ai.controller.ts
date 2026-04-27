import { Controller, Post, Body, Req, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { GeminiService } from './gemini.service';

class AIRecommendationRequest {
  @IsString()
  description: string;

  @IsString()
  @IsOptional()
  department?: string;
}

class MatchedSkillDto {
  skill: string;
  rating: number;
}

class EmployeeRecommendationDto {
  employeeId: string;
  employeeName: string;
  department: string;
  score: number;
  matchedSkills: MatchedSkillDto[];
  missingSkills: string[];
  isFromOtherDepartment: boolean;
}

class AIRecommendationResponse {
  success: boolean;
  extractedSkills: string[];
  recommendations: EmployeeRecommendationDto[];
}

@ApiTags('AI Recommendations')
@Controller('ai')
export class AIController {
  constructor(private readonly geminiService: GeminiService) {}

  @Post('recommend-employees')
  @ApiOperation({ summary: 'Get AI-recommended employees based on description' })
  @ApiResponse({ status: 200, description: 'Recommendations generated successfully', type: AIRecommendationResponse })
  async recommendEmployees(@Body() req: AIRecommendationRequest, @Req() request: any): Promise<AIRecommendationResponse> {
    // Get department from body first, then from authenticated user, then empty (global search)
    let department = req.department;
    if (!department && request.user) {
      department = request.user.department;
    }
    if (!department) {
      department = ''; // Empty = search all departments
    }

    const recommendations = await this.geminiService.findMatchingEmployees(department, req.description);

    return {
      success: true,
      extractedSkills: recommendations.length > 0 ? recommendations[0].matchedSkills.map(s => s.skill) : [],
      recommendations: recommendations.map(r => ({
        employeeId: r.employeeId,
        employeeName: r.employeeName,
        department: r.department,
        score: r.score,
        matchedSkills: r.matchedSkills,
        missingSkills: r.missingSkills,
        isFromOtherDepartment: r.isFromOtherDepartment,
      })),
    };
  }
}

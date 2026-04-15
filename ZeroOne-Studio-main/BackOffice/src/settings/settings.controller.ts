import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { SettingsService } from './settings.service';

@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get(':userId')
  @ApiOperation({ summary: 'Get settings by user id' })
  getByUserId(@Param('userId') userId: string) {
    return this.settingsService.getByUserId(userId);
  }

  @Patch(':userId')
  @ApiOperation({ summary: 'Update settings by user id' })
  updateByUserId(@Param('userId') userId: string, @Body() dto: UpdateSettingsDto) {
    return this.settingsService.updateByUserId(userId, dto);
  }
}

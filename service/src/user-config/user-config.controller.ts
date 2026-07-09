import {
  Body,
  Controller,
  Get,
  Put,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserConfigService } from './user-config.service';
import type { JwtPayload } from '../auth/jwt.strategy';

@Controller('user/notion-config')
@UseGuards(JwtAuthGuard)
export class UserConfigController {
  constructor(private readonly userConfigService: UserConfigService) {}

  @Get()
  async getConfig(@CurrentUser() user: JwtPayload) {
    const config = await this.userConfigService.getConfig(user.id);
    if (!config) {
      return { configured: false, token: '', dbIds: {} };
    }
    return {
      configured: true,
      token: config.token ? '••••••••' : '',
      tokenConfigured: !!config.token,
      dbIds: config.dbIds,
    };
  }

  @Put()
  async saveConfig(
    @CurrentUser() user: JwtPayload,
    @Body() body: { token?: string; dbIds?: Record<string, string> },
  ) {
    await this.userConfigService.saveConfig(
      user.id,
      body.token ?? '',
      body.dbIds ?? {},
    );
    return { configured: true, tokenConfigured: !!body.token };
  }

  @Delete()
  async deleteConfig(@CurrentUser() user: JwtPayload) {
    await this.userConfigService.deleteConfig(user.id);
    return { configured: false };
  }
}

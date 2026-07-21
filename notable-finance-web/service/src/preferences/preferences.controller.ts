import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PreferencesService } from './preferences.service';
import type { JwtPayload } from '../auth/jwt.strategy';

@Controller('user/preferences')
@UseGuards(JwtAuthGuard)
export class PreferencesController {
  constructor(private readonly preferencesService: PreferencesService) {}

  @Get()
  getPreferences(@CurrentUser() user: JwtPayload) {
    return this.preferencesService.getPreferences(user.id);
  }

  @Put()
  savePreferences(
    @CurrentUser() user: JwtPayload,
    @Body() body: { showFab?: boolean },
  ) {
    const patch: { showFab?: boolean } = {};
    if (typeof body.showFab === 'boolean') {
      patch.showFab = body.showFab;
    }
    return this.preferencesService.savePreferences(user.id, patch);
  }
}

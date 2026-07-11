import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from './jwt.strategy';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ short: { limit: 10, ttl: 60_000 } })
  register(
    @Body() body: { email: string; password: string; name?: string },
  ) {
    return this.authService.register(body.email, body.password, body.name);
  }

  @Post('login')
  @Throttle({ short: { limit: 10, ttl: 60_000 } })
  login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: JwtPayload) {
    return this.authService.me(user.id);
  }

  @Post('logout')
  logout() {
    return { loggedOut: true };
  }

  @Patch('email')
  @UseGuards(JwtAuthGuard)
  changeEmail(
    @Body() body: { currentPassword: string; newEmail: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.authService.changeEmail(
      user.id,
      body.currentPassword,
      body.newEmail,
    );
  }

  @Patch('password')
  @UseGuards(JwtAuthGuard)
  changePassword(
    @Body() body: { currentPassword: string; newPassword: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.authService.changePassword(
      user.id,
      body.currentPassword,
      body.newPassword,
    );
  }

  @Delete('account')
  @UseGuards(JwtAuthGuard)
  deleteAccount(
    @Body() body: { currentPassword: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.authService.deleteAccount(user.id, body.currentPassword);
  }
}

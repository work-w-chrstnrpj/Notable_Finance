import { Body, Controller, Get, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() body: { email?: string }) {
    return this.authService.issueDevelopmentSession(body.email ?? 'owner@example.local');
  }

  @Post('google')
  google(@Body() body: { email?: string }) {
    return this.authService.issueDevelopmentSession(body.email ?? 'google-user@example.local');
  }

  @Get('me')
  me() {
    return this.authService.currentDevelopmentUser();
  }

  @Post('logout')
  logout() {
    return { loggedOut: true };
  }
}

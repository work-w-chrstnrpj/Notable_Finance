import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  issueDevelopmentSession(email: string) {
    const user = {
      id: `user-${email}`,
      email,
      roles: ['owner'],
    };

    return {
      user,
      accessToken: this.jwtService.sign(user),
      authMode: 'development',
      note: 'Replace this development session issuer with production email and Google auth before release.',
    };
  }

  currentDevelopmentUser() {
    return {
      id: 'user-owner',
      email: 'owner@example.local',
      roles: ['owner'],
      authMode: 'development',
    };
  }
}

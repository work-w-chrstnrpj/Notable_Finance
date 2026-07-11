import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { ApiException } from '../common/api-exception';
import type { JwtPayload } from './jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async register(email: string, password: string, name?: string) {
    const user = await this.usersService.register(email, password, name);
    const payload: JwtPayload = { id: user.id, email: user.email, roles: ['user'] };
    return {
      user: { id: user.id, email: user.email, name: user.name },
      accessToken: this.jwtService.sign(payload),
    };
  }

  async login(email: string, password: string) {
    const user = await this.usersService.login(email, password);
    const payload: JwtPayload = { id: user.id, email: user.email, roles: ['user'] };
    return {
      user: { id: user.id, email: user.email, name: user.name },
      accessToken: this.jwtService.sign(payload),
    };
  }

  async me(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        'USER_NOT_FOUND',
        'Authenticated user not found.',
      );
    }
    return { id: user.id, email: user.email, name: user.name };
  }

  async changeEmail(userId: string, currentPassword: string, newEmail: string) {
    const user = await this.usersService.changeEmail(
      userId,
      currentPassword,
      newEmail,
    );
    const payload: JwtPayload = { id: user.id, email: user.email, roles: ['user'] };
    return {
      user: { id: user.id, email: user.email, name: user.name },
      accessToken: this.jwtService.sign(payload),
    };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    await this.usersService.changePassword(userId, currentPassword, newPassword);
    return { changed: true };
  }

  async deleteAccount(userId: string, currentPassword: string) {
    await this.usersService.deleteAccount(userId, currentPassword);
    return { deleted: true };
  }
}

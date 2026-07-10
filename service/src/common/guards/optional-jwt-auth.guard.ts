import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Optional JWT auth guard: runs Passport's JWT strategy so that request.user is
 * populated when a valid Bearer token is present, but never rejects the request
 * when the token is missing or invalid.
 *
 * Use on read-only endpoints that want to know the caller's identity when
 * available (to pull that user's per-user Notion config from Postgres) without
 * forcing anonymous callers to authenticate.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // Always allow the request through, regardless of Passport's outcome.
  handleRequest<TUser = unknown>(_err: unknown, user: TUser | false): TUser | undefined {
    return user || undefined;
  }

  // canActivate normally returns whatever Passport returns (true/false or a
  // thrown UnauthorizedException). Swallow any failures so the request
  // continues even when the Bearer token is missing or invalid.
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      await super.canActivate(context);
    } catch {
      // No-op — treat as anonymous.
    }
    return true;
  }
}

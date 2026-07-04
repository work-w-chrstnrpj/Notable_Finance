import { Injectable } from '@nestjs/common';

const sensitiveKeys = new Set(['token', 'notionToken', 'password', 'secret']);

@Injectable()
export class LoggingService {
  redact(payload: Record<string, unknown>) {
    return Object.fromEntries(
      Object.entries(payload).map(([key, value]) => [
        key,
        sensitiveKeys.has(key) ? '[REDACTED]' : value,
      ]),
    );
  }
}

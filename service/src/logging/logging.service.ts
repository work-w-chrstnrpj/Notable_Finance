import { Injectable, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';

const sensitiveKeys = new Set(['token', 'notionToken', 'password', 'secret']);

const devColorFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.colorize(),
  winston.format.printf(
    ({ timestamp, level, message, context, ...meta }) => {
      const ctx = context ? ` [${context}]` : '';
      const prefix = `${timestamp} ${level}:${ctx}`;
      const extra =
        meta && typeof meta === 'object' && Object.keys(meta).length > 0
          ? ` ${JSON.stringify(meta)}`
          : '';
      return `${prefix} ${message}${extra}`;
    },
  ),
);

const prodJsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json(),
);

@Injectable()
export class LoggingService implements LoggerService {
  private readonly logger: winston.Logger;

  constructor(private readonly configService: ConfigService) {
    const nodeEnv = this.configService.get<string>('nodeEnv', 'development');
    const isProduction = nodeEnv === 'production';

    this.logger = winston.createLogger({
      level: isProduction ? 'info' : 'debug',
      levels: winston.config.syslog.levels,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format((info) => {
          // Redact sensitive fields at the formatting stage
          if (info.meta && typeof info.meta === 'object') {
            info.meta = this.redact(info.meta as Record<string, unknown>);
          }
          return info;
        })(),
      ),
      transports: [
        new winston.transports.Console({
          format: isProduction ? prodJsonFormat : devColorFormat,
        }),
      ],
    });
  }

  /**
   * Recursively redact sensitive keys from a payload.
   */
  redact(payload: Record<string, unknown>): Record<string, unknown> {
    const redactValue = (value: unknown): unknown => {
      if (value === null || value === undefined) return value;
      if (Array.isArray(value)) return value.map(redactValue);
      if (typeof value === 'object') {
        return Object.fromEntries(
          Object.entries(value as Record<string, unknown>).map(
            ([key, val]) => [
              key,
              sensitiveKeys.has(key) ? '[REDACTED]' : redactValue(val),
            ],
          ),
        );
      }
      return value;
    };

    return Object.fromEntries(
      Object.entries(payload).map(([key, value]) => [
        key,
        sensitiveKeys.has(key) ? '[REDACTED]' : redactValue(value),
      ]),
    );
  }

  // ── LoggerService interface implementation ──────────────

  log(message: any, ...optionalParams: any[]): void {
    const { context, rest } = this.parseOptionalParams(optionalParams);
    this.logger.info(message, { context, ...rest });
  }

  error(message: any, ...optionalParams: any[]): void {
    const { context, trace, rest } = this.parseErrorParams(optionalParams);
    this.logger.error(message, {
      context,
      trace,
      meta: Object.keys(rest).length > 0 ? rest : undefined,
    });
  }

  warn(message: any, ...optionalParams: any[]): void {
    const { context, rest } = this.parseOptionalParams(optionalParams);
    this.logger.warn(message, { context, ...rest });
  }

  debug(message: any, ...optionalParams: any[]): void {
    const { context, rest } = this.parseOptionalParams(optionalParams);
    this.logger.debug(message, { context, ...rest });
  }

  verbose(message: any, ...optionalParams: any[]): void {
    const { context, rest } = this.parseOptionalParams(optionalParams);
    this.logger.verbose(message, { context, ...rest });
  }

  // ── Convenience methods with structured meta ────────────

  info(message: string, context?: string, meta?: Record<string, unknown>): void {
    this.logger.info(message, {
      context,
      meta: meta ? this.redact(meta) : undefined,
    });
  }

  // ── Private helpers ─────────────────────────────────────

  private parseOptionalParams(
    params: any[],
  ): { context?: string; rest: Record<string, unknown> } {
    if (params.length === 0) return { rest: {} };
    const first = params[0];
    if (typeof first === 'string') {
      return { context: first, rest: {} };
    }
    // If the first param is an object without a context string, treat it as meta
    return { rest: first && typeof first === 'object' ? first : {} };
  }

  private parseErrorParams(
    params: any[],
  ): { context?: string; trace?: string; rest: Record<string, unknown> } {
    if (params.length === 0) return { rest: {} };
    const first = params[0];
    const second = params[1];

    // NestJS LoggerService.error(message, trace, context)
    if (typeof first === 'string' && typeof second === 'string') {
      return { trace: first, context: second, rest: {} };
    }
    // error(message, context)
    if (typeof first === 'string') {
      return { context: first, rest: {} };
    }
    // error(message, meta)
    return { rest: first && typeof first === 'object' ? first : {} };
  }
}

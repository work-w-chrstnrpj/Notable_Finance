import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import { DatabaseService } from '../database/database.service';
import { ApiException } from '../common/api-exception';

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

interface UserRow {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  created_at: string;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly db: DatabaseService) {}

  async register(
    email: string,
    password: string,
    name?: string,
  ): Promise<User> {
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await this.findByEmail(normalizedEmail);
    if (existing) {
      throw new ApiException(
        HttpStatus.CONFLICT,
        'EMAIL_EXISTS',
        'An account with this email already exists.',
      );
    }

    const salt = randomUUID().replace(/-/g, '').slice(0, 16);
    const hash = scryptSync(password, salt, 64).toString('hex');
    const passwordHash = `${hash}:${salt}`;
    const id = randomUUID();

    await this.db.query(
      `INSERT INTO users (id, email, name, password_hash) VALUES ($1, $2, $3, $4)`,
      [id, normalizedEmail, name ?? '', passwordHash],
    );

    this.logger.log(`User registered: ${normalizedEmail}`);
    return { id, email: normalizedEmail, name: name ?? '', createdAt: new Date().toISOString() };
  }

  async login(
    email: string,
    password: string,
  ): Promise<User> {
    const normalizedEmail = email.toLowerCase().trim();
    const rows = await this.db.query<UserRow>(
      `SELECT id, email, name, password_hash, created_at FROM users WHERE email = $1`,
      [normalizedEmail],
    );

    if (rows.length === 0) {
      throw new ApiException(
        HttpStatus.UNAUTHORIZED,
        'INVALID_CREDENTIALS',
        'Invalid email or password.',
      );
    }

    const row = rows[0];
    const [, salt] = row.password_hash.split(':');
    const hash = scryptSync(password, salt, 64).toString('hex');
    const expectedHash = Buffer.from(hash, 'hex');
    const actualHash = Buffer.from(row.password_hash.split(':')[0], 'hex');

    if (
      expectedHash.length !== actualHash.length ||
      !timingSafeEqual(expectedHash, actualHash)
    ) {
      throw new ApiException(
        HttpStatus.UNAUTHORIZED,
        'INVALID_CREDENTIALS',
        'Invalid email or password.',
      );
    }

    this.logger.log(`User logged in: ${normalizedEmail}`);
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      createdAt: row.created_at,
    };
  }

  async findById(id: string): Promise<User | null> {
    const rows = await this.db.query<UserRow>(
      `SELECT id, email, name, password_hash, created_at FROM users WHERE id = $1`,
      [id],
    );
    if (rows.length === 0) return null;
    return {
      id: rows[0].id,
      email: rows[0].email,
      name: rows[0].name,
      createdAt: rows[0].created_at,
    };
  }

  private async findByEmail(email: string): Promise<User | null> {
    const rows = await this.db.query<UserRow>(
      `SELECT id, email, name, password_hash, created_at FROM users WHERE email = $1`,
      [email],
    );
    if (rows.length === 0) return null;
    return {
      id: rows[0].id,
      email: rows[0].email,
      name: rows[0].name,
      createdAt: rows[0].created_at,
    };
  }
}

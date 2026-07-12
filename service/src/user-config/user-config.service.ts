import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from 'node:crypto';
import { DatabaseService } from '../database/database.service';

export interface UserNotionConfig {
  id: string;
  userId: string;
  token: string;
  dbIds: Record<string, string>;
}

interface ConfigRow {
  id: string;
  user_id: string;
  encrypted_token: string;
  db_ids: Record<string, string>;
}

@Injectable()
export class UserConfigService {
  private readonly logger = new Logger(UserConfigService.name);
  private readonly encryptionKey: Buffer | null = null;

  constructor(
    private readonly db: DatabaseService,
    private readonly configService: ConfigService,
  ) {
    const keyHex = this.configService.get<string>('encryptionKey');
    if (keyHex) {
      this.encryptionKey = scryptSync(keyHex, 'notion-finance-salt', 32);
    }
  }

  get isEncryptionAvailable(): boolean {
    return this.encryptionKey !== null;
  }

  async getConfig(userId: string): Promise<UserNotionConfig | null> {
    const rows = await this.db.query<ConfigRow>(
      `SELECT id, user_id, encrypted_token, db_ids FROM user_notion_configs WHERE user_id = $1`,
      [userId],
    );
    if (rows.length === 0) return null;

    const row = rows[0];
    let token = '';
    if (row.encrypted_token && this.encryptionKey) {
      try {
        token = this.decrypt(row.encrypted_token);
      } catch (err) {
        this.logger.warn(
          `Failed to decrypt Notion token for user ${userId}: ${err instanceof Error ? err.message : String(err)}. ` +
          'Re-save your Notion token in Settings to fix this.',
        );
        // Check if it's actually encrypted (hex:hex:hex format) or plaintext
        const parts = row.encrypted_token.split(':');
        const isEncryptedFormat =
          parts.length === 3 &&
          parts.every((p) => /^[0-9a-f]+$/i.test(p));
        if (!isEncryptedFormat) {
          token = row.encrypted_token;
          this.logger.log(`Using plaintext Notion token fallback for user ${userId}`);
        }
      }
    } else if (row.encrypted_token && !this.encryptionKey) {
      // No encryption key configured — treat as plaintext
      token = row.encrypted_token;
    }

    return {
      id: row.id,
      userId: row.user_id,
      token,
      dbIds: row.db_ids ?? {},
    };
  }

  async saveConfig(
    userId: string,
    token: string,
    dbIds: Record<string, string>,
  ): Promise<void> {
    const encryptedToken =
      token && this.encryptionKey ? this.encrypt(token) : '';

    await this.db.query(
      `INSERT INTO user_notion_configs (user_id, encrypted_token, db_ids)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id)
       DO UPDATE SET encrypted_token = $2, db_ids = $3, updated_at = NOW()`,
      [userId, encryptedToken, JSON.stringify(dbIds)],
    );

    this.logger.log(`Notion config saved for user ${userId}`);
  }

  async deleteConfig(userId: string): Promise<void> {
    await this.db.query(
      `DELETE FROM user_notion_configs WHERE user_id = $1`,
      [userId],
    );
  }

  private encrypt(plaintext: string): string {
    if (!this.encryptionKey) throw new Error('Encryption key not configured');
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    let encrypted = cipher.update(plaintext, 'utf-8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  private decrypt(ciphertext: string): string {
    if (!this.encryptionKey) throw new Error('Encryption key not configured');
    const parts = ciphertext.split(':');
    if (parts.length !== 3) throw new Error('Invalid encrypted format');
    const [ivHex, authTagHex, encrypted] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');
    return decrypted;
  }
}

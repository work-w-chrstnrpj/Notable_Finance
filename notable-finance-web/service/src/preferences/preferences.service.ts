import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface UserPreferences {
  showFab: boolean;
}

interface PreferencesRow {
  show_fab: boolean;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  showFab: true,
};

@Injectable()
export class PreferencesService {
  private readonly logger = new Logger(PreferencesService.name);

  constructor(private readonly db: DatabaseService) {}

  async getPreferences(userId: string): Promise<UserPreferences> {
    if (!this.db.isConfigured) {
      return { ...DEFAULT_PREFERENCES };
    }

    const rows = await this.db.query<PreferencesRow>(
      `SELECT show_fab FROM user_preferences WHERE user_id = $1`,
      [userId],
    );
    if (rows.length === 0) {
      return { ...DEFAULT_PREFERENCES };
    }
    return { showFab: rows[0].show_fab };
  }

  async savePreferences(
    userId: string,
    patch: Partial<UserPreferences>,
  ): Promise<UserPreferences> {
    const current = await this.getPreferences(userId);
    const next: UserPreferences = { ...current, ...patch };

    if (!this.db.isConfigured) {
      return next;
    }

    await this.db.query(
      `INSERT INTO user_preferences (user_id, show_fab)
       VALUES ($1, $2)
       ON CONFLICT (user_id)
       DO UPDATE SET show_fab = $2, updated_at = NOW()`,
      [userId, next.showFab],
    );

    this.logger.log(`Preferences saved for user ${userId}`);
    return next;
  }
}

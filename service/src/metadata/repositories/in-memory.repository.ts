import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type {
  AuditEvent,
  ConflictRecord,
  IMetadataRepository,
  PendingMutation,
  SnapshotEntry,
  SyncLogEntry,
} from '../interfaces/repository.interface';

@Injectable()
export class InMemoryMetadataRepository implements IMetadataRepository {
  private readonly syncLogs: SyncLogEntry[] = [];
  private readonly pendingMutations: PendingMutation[] = [];
  private readonly conflicts: ConflictRecord[] = [];
  private readonly auditEvents: AuditEvent[] = [];
  private readonly snapshots: SnapshotEntry[] = [];

  // ── Sync logs ──────────────────────────────────────────────

  async addSyncLog(
    entry: Omit<SyncLogEntry, 'id' | 'createdAt'>,
  ): Promise<SyncLogEntry> {
    const record: SyncLogEntry = {
      id: randomUUID(),
      ...entry,
      createdAt: new Date().toISOString(),
    };
    this.syncLogs.push(record);
    return record;
  }

  async listSyncLogs(limit = 50, offset = 0): Promise<SyncLogEntry[]> {
    return this.syncLogs.slice(offset, offset + limit);
  }

  // ── Pending mutations ──────────────────────────────────────

  async addPendingMutation(
    mutation: Omit<PendingMutation, 'id' | 'createdAt'>,
  ): Promise<PendingMutation> {
    const record: PendingMutation = {
      id: randomUUID(),
      ...mutation,
      createdAt: new Date().toISOString(),
    };
    this.pendingMutations.push(record);
    return record;
  }

  async updateMutationStatus(
    id: string,
    status: PendingMutation['status'],
    errorCode?: string,
    errorMessage?: string,
  ): Promise<void> {
    const mutation = this.pendingMutations.find((m) => m.id === id);
    if (mutation) {
      mutation.status = status;
      mutation.errorCode = errorCode ?? null;
      mutation.errorMessage = errorMessage ?? null;
      if (status === 'applied' || status === 'failed') {
        mutation.appliedAt = new Date().toISOString();
      }
    }
  }

  async listPendingMutations(
    status?: PendingMutation['status'],
  ): Promise<PendingMutation[]> {
    if (status) {
      return this.pendingMutations.filter((m) => m.status === status);
    }
    return [...this.pendingMutations];
  }

  // ── Conflicts ──────────────────────────────────────────────

  async addConflict(
    conflict: Omit<ConflictRecord, 'id' | 'detectedAt' | 'resolved'>,
  ): Promise<ConflictRecord> {
    const record: ConflictRecord = {
      id: randomUUID(),
      ...conflict,
      detectedAt: new Date().toISOString(),
      resolved: false,
      resolvedAt: null,
      resolution: null,
    };
    this.conflicts.push(record);
    return record;
  }

  async resolveConflict(
    id: string,
    resolution: ConflictRecord['resolution'],
  ): Promise<void> {
    const conflict = this.conflicts.find((c) => c.id === id);
    if (conflict) {
      conflict.resolved = true;
      conflict.resolvedAt = new Date().toISOString();
      conflict.resolution = resolution;
    }
  }

  async listConflicts(resolved?: boolean): Promise<ConflictRecord[]> {
    if (resolved !== undefined) {
      return this.conflicts.filter((c) => c.resolved === resolved);
    }
    return [...this.conflicts];
  }

  // ── Audit events ───────────────────────────────────────────

  async addAuditEvent(
    event: Omit<AuditEvent, 'id' | 'createdAt'>,
  ): Promise<AuditEvent> {
    const record: AuditEvent = {
      id: randomUUID(),
      ...event,
      createdAt: new Date().toISOString(),
    };
    this.auditEvents.push(record);
    return record;
  }

  async listAuditEvents(limit = 50, offset = 0): Promise<AuditEvent[]> {
    return this.auditEvents.slice(offset, offset + limit);
  }

  // ── Snapshots ──────────────────────────────────────────────

  async saveSnapshot(
    snapshot: Omit<SnapshotEntry, 'id' | 'capturedAt'>,
  ): Promise<SnapshotEntry> {
    const record: SnapshotEntry = {
      id: randomUUID(),
      ...snapshot,
      capturedAt: new Date().toISOString(),
    };
    this.snapshots.push(record);
    return record;
  }

  async getLatestSnapshot(
    resource: string,
    month: string,
  ): Promise<SnapshotEntry | null> {
    const matching = this.snapshots.filter(
      (s) => s.resource === resource && s.month === month,
    );
    if (matching.length === 0) return null;
    // Return the most recent by capturedAt
    return matching.reduce((latest, current) =>
      current.capturedAt > latest.capturedAt ? current : latest,
    );
  }
}

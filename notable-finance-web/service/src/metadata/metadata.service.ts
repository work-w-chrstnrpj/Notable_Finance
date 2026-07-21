import { Inject, Injectable } from '@nestjs/common';
import { LoggingService } from '../logging/logging.service';
import type {
  AuditEvent,
  ConflictRecord,
  IMetadataRepository,
  PendingMutation,
  SnapshotEntry,
  SyncLogEntry,
} from './interfaces/repository.interface';
import { METADATA_REPOSITORY } from './providers';

@Injectable()
export class MetadataService {
  constructor(
    @Inject(METADATA_REPOSITORY)
    private readonly repository: IMetadataRepository,
    private readonly loggingService: LoggingService,
  ) {}

  // ── Sync logs ──────────────────────────────────────────────

  async addSyncLog(
    entry: Omit<SyncLogEntry, 'id' | 'createdAt'>,
  ): Promise<SyncLogEntry> {
    const record = await this.repository.addSyncLog(entry);
    this.loggingService.info(`Sync log: ${entry.type} ${entry.resource}`, 'MetadataService', {
      syncLog: { type: entry.type, resource: entry.resource, description: entry.description },
    });
    return record;
  }

  async listSyncLogs(limit?: number, offset?: number): Promise<SyncLogEntry[]> {
    return this.repository.listSyncLogs(limit, offset);
  }

  // ── Pending mutations ──────────────────────────────────────

  async addPendingMutation(
    mutation: Omit<PendingMutation, 'id' | 'createdAt'>,
  ): Promise<PendingMutation> {
    const record = await this.repository.addPendingMutation(mutation);
    this.loggingService.info(
      `Pending mutation: ${mutation.action} ${mutation.resource}`,
      'MetadataService',
      { pendingMutation: { clientOperationId: mutation.clientOperationId, resource: mutation.resource, action: mutation.action } },
    );
    return record;
  }

  async updateMutationStatus(
    id: string,
    status: PendingMutation['status'],
    errorCode?: string,
    errorMessage?: string,
  ): Promise<void> {
    await this.repository.updateMutationStatus(id, status, errorCode, errorMessage);
    this.loggingService.info(`Mutation ${id} -> ${status}`, 'MetadataService', {
      errorCode: errorCode ?? undefined,
    });
  }

  async listPendingMutations(
    status?: PendingMutation['status'],
  ): Promise<PendingMutation[]> {
    return this.repository.listPendingMutations(status);
  }

  // ── Conflicts ──────────────────────────────────────────────

  async addConflict(
    conflict: Omit<ConflictRecord, 'id' | 'detectedAt' | 'resolved'>,
  ): Promise<ConflictRecord> {
    const record = await this.repository.addConflict(conflict);
    this.loggingService.info(
      `Conflict detected: ${conflict.resource}/${conflict.recordId}`,
      'MetadataService',
      { conflict: { resource: conflict.resource, recordId: conflict.recordId } },
    );
    return record;
  }

  async resolveConflict(
    id: string,
    resolution: ConflictRecord['resolution'],
  ): Promise<void> {
    await this.repository.resolveConflict(id, resolution);
    this.loggingService.info(`Conflict ${id} resolved as ${resolution}`, 'MetadataService');
  }

  async listConflicts(resolved?: boolean): Promise<ConflictRecord[]> {
    return this.repository.listConflicts(resolved);
  }

  // ── Audit events (backward-compatible wrapper) ─────────────

  /**
   * Record an audit event with the given type and message.
   * This overload preserves the original simpler signature for existing callers.
   */
  async addAuditEvent(
    type: string,
    message: string,
    options?: {
      resource?: string;
      recordId?: string;
      actor?: string;
      metadata?: Record<string, unknown>;
    },
  ): Promise<AuditEvent> {
    const event = await this.repository.addAuditEvent({
      type,
      message,
      resource: options?.resource,
      recordId: options?.recordId,
      actor: options?.actor,
      metadata: options?.metadata ?? null,
    });
    this.loggingService.info(`Audit event: ${type}`, 'MetadataService', {
      auditEvent: { type, message, resource: options?.resource, recordId: options?.recordId },
    });
    return event;
  }

  async listAuditEvents(limit?: number, offset?: number): Promise<AuditEvent[]> {
    return this.repository.listAuditEvents(limit, offset);
  }

  // ── Snapshots ──────────────────────────────────────────────

  async saveSnapshot(
    snapshot: Omit<SnapshotEntry, 'id' | 'capturedAt'>,
  ): Promise<SnapshotEntry> {
    const record = await this.repository.saveSnapshot(snapshot);
    this.loggingService.info(
      `Snapshot saved: ${snapshot.resource}/${snapshot.month} (${snapshot.recordCount} records)`,
      'MetadataService',
    );
    return record;
  }

  async getLatestSnapshot(
    resource: string,
    month: string,
  ): Promise<SnapshotEntry | null> {
    return this.repository.getLatestSnapshot(resource, month);
  }
}

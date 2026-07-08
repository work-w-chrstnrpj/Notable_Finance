export interface SyncLogEntry {
  id: string;
  type: 'create' | 'update' | 'delete' | 'pull' | 'error';
  resource: string;
  description: string;
  operationCount?: number;
  failureCount?: number;
  createdAt: string;
}

export interface PendingMutation {
  id: string;
  clientOperationId: string;
  resource: string;
  action: string;
  recordId: string | null;
  data: Record<string, unknown> | null;
  status: 'pending' | 'applied' | 'failed';
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string;
  appliedAt: string | null;
}

export interface ConflictRecord {
  id: string;
  resource: string;
  recordId: string;
  localVersion: Record<string, unknown> | null;
  remoteVersion: Record<string, unknown> | null;
  detectedAt: string;
  resolved: boolean;
  resolvedAt: string | null;
  resolution: 'local' | 'remote' | null;
}

export interface AuditEvent {
  id: string;
  type: string;
  message: string;
  resource?: string;
  recordId?: string;
  actor?: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface SnapshotEntry {
  id: string;
  resource: string;
  month: string;
  snapshot: Record<string, unknown>[];
  recordCount: number;
  capturedAt: string;
}

export interface IMetadataRepository {
  // Sync logs
  addSyncLog(entry: Omit<SyncLogEntry, 'id' | 'createdAt'>): Promise<SyncLogEntry>;
  listSyncLogs(limit?: number, offset?: number): Promise<SyncLogEntry[]>;

  // Pending mutations
  addPendingMutation(mutation: Omit<PendingMutation, 'id' | 'createdAt'>): Promise<PendingMutation>;
  updateMutationStatus(
    id: string,
    status: PendingMutation['status'],
    errorCode?: string,
    errorMessage?: string,
  ): Promise<void>;
  listPendingMutations(status?: PendingMutation['status']): Promise<PendingMutation[]>;

  // Conflicts
  addConflict(conflict: Omit<ConflictRecord, 'id' | 'detectedAt' | 'resolved'>): Promise<ConflictRecord>;
  resolveConflict(id: string, resolution: ConflictRecord['resolution']): Promise<void>;
  listConflicts(resolved?: boolean): Promise<ConflictRecord[]>;

  // Audit events
  addAuditEvent(event: Omit<AuditEvent, 'id' | 'createdAt'>): Promise<AuditEvent>;
  listAuditEvents(limit?: number, offset?: number): Promise<AuditEvent[]>;

  // Snapshots
  saveSnapshot(snapshot: Omit<SnapshotEntry, 'id' | 'capturedAt'>): Promise<SnapshotEntry>;
  getLatestSnapshot(resource: string, month: string): Promise<SnapshotEntry | null>;
}

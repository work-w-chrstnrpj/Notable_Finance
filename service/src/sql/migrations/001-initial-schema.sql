-- Migration 001: Initial Metadata Schema
-- Creates tables for sync logs, pending mutations, conflicts,
-- audit events, and snapshots for the Notion Finance backend.

-- Sync Logs table
CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) NOT NULL,
  resource VARCHAR(50) NOT NULL,
  description TEXT,
  operation_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pending Mutations table
CREATE TABLE IF NOT EXISTS pending_mutations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_operation_id VARCHAR(100) NOT NULL,
  resource VARCHAR(50) NOT NULL,
  action VARCHAR(20) NOT NULL,
  record_id VARCHAR(100),
  data JSONB,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  error_code VARCHAR(50),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  applied_at TIMESTAMPTZ
);

-- Conflicts table
CREATE TABLE IF NOT EXISTS conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource VARCHAR(50) NOT NULL,
  record_id VARCHAR(100) NOT NULL,
  local_version JSONB,
  remote_version JSONB,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolution VARCHAR(10)
);

-- Audit Events table
CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  resource VARCHAR(50),
  record_id VARCHAR(100),
  actor VARCHAR(100),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Snapshots table
CREATE TABLE IF NOT EXISTS snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource VARCHAR(50) NOT NULL,
  month VARCHAR(7) NOT NULL,
  snapshot JSONB NOT NULL,
  record_count INTEGER NOT NULL DEFAULT 0,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_sync_logs_type ON sync_logs(type);
CREATE INDEX IF NOT EXISTS idx_sync_logs_created_at ON sync_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pending_mutations_status ON pending_mutations(status);
CREATE INDEX IF NOT EXISTS idx_conflicts_resource_record ON conflicts(resource, record_id);
CREATE INDEX IF NOT EXISTS idx_conflicts_resolved ON conflicts(resolved);
CREATE INDEX IF NOT EXISTS idx_audit_events_type ON audit_events(type);
CREATE INDEX IF NOT EXISTS idx_audit_events_created_at ON audit_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_snapshots_resource_month ON snapshots(resource, month);

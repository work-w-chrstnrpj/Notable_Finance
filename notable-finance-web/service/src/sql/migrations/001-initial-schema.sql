-- Migration 001: Database bootstrap
-- Enables gen_random_uuid() used by subsequent migrations.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

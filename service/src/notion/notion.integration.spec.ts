/**
 * Group G / G2 — backend integration tests against the sandbox Notion DBs.
 *
 * Composes real @notionhq/client + NotionApiClient + property mapper to
 * exercise the create → detail → update → soft-delete round-trip end-to-end.
 *
 * Guarded on env: skipped entirely when NOTION_TOKEN + the 5 required DB IDs
 * are absent, so CI without secrets stays green.
 *
 * NEVER run against production Notion. The .env this reads is the sandbox
 * per the AGENTS.md / project rule.
 */

import { config as loadDotenv } from 'dotenv';
import { describe, expect, it, beforeAll } from 'vitest';
import { Client } from '@notionhq/client';
import { NotionApiClient } from './notion-api-client';
import {
  expenseDtoToProperties,
  incomeDtoToProperties,
  pageToExpenseRecord,
  pageToIncomeRecord,
} from './notion-property-mapper';
import type { ResourceName } from '../common/finance.types';

// Load .env from the service dir so the vitest suite mirrors app runtime env.
loadDotenv();

const token = process.env.NOTION_TOKEN ?? '';
const dbIds: Partial<Record<ResourceName, string>> = {
  accounts: process.env.NOTION_ACCOUNTS_DB_ID,
  incomeCategories: process.env.NOTION_INCOME_CATEGORIES_DB_ID,
  incomes: process.env.NOTION_INCOMES_DB_ID,
  expenseCategories: process.env.NOTION_EXPENSE_CATEGORIES_DB_ID,
  expenses: process.env.NOTION_EXPENSES_DB_ID,
};

const missing = (Object.entries(dbIds) as [string, string | undefined][]).filter(
  ([, v]) => !v,
);
const skipReason = !token
  ? 'NOTION_TOKEN not set'
  : missing.length > 0
    ? `Missing DB IDs: ${missing.map(([k]) => k).join(', ')}`
    : null;

const describeIfLive = skipReason ? describe.skip : describe;

describeIfLive('NotionApiClient (live sandbox)', () => {
  let raw: Client;
  let client: NotionApiClient;
  let sampleAccountId = '';
  let sampleIncomeCategoryId = '';
  let sampleExpenseCategoryId = '';

  beforeAll(async () => {
    raw = new Client({ auth: token });
    client = new NotionApiClient(raw, dbIds);

    // Pull one real active account + income category + expense category so the
    // relations we send are valid targets in the sandbox.
    const accounts = await client.queryDatabase('accounts');
    const firstActiveNonAux = accounts.find((p) => {
      const props = p.properties as Record<string, unknown>;
      const inactive =
        ((props.Inactive as { checkbox?: boolean } | undefined)?.checkbox) ??
        false;
      const type = (props['Account Type'] as { select?: { name?: string } } | undefined)
        ?.select?.name;
      return !inactive && type !== 'Auxiliary';
    });
    if (!firstActiveNonAux) throw new Error('No active non-Auxiliary account');
    sampleAccountId = firstActiveNonAux.id as string;

    const incomeCats = await client.queryDatabase('incomeCategories');
    if (!incomeCats.length) throw new Error('No income categories');
    sampleIncomeCategoryId = incomeCats[0].id as string;

    const expenseCats = await client.queryDatabase('expenseCategories');
    if (!expenseCats.length) throw new Error('No expense categories');
    sampleExpenseCategoryId = expenseCats[0].id as string;
  }, 60_000);

  it(
    'creates, updates, and soft-deletes an income via the property mapper',
    async () => {
      const stamp = Date.now();
      const name = `G2 integration income ${stamp}`;

      // ── Create ──────────────────────────────────────────────────
      const createProps = incomeDtoToProperties({
        name,
        date: '2026-07-09',
        grossIncome: 111.11,
        capitalExpenditure: 0,
        accountId: sampleAccountId,
        categoryId: sampleIncomeCategoryId,
      });
      const createdPage = await client.createPage('incomes', createProps);
      const created = pageToIncomeRecord(createdPage);
      expect(created.name).toBe(name);
      expect(created.grossIncome).toBe(111.11);
      expect(created.accountId).toBe(sampleAccountId);
      expect(created.categoryId).toBe(sampleIncomeCategoryId);

      // ── Update (partial: only grossIncome) ──────────────────────
      const updateProps = incomeDtoToProperties({ grossIncome: 222.22 });
      const updatedPage = await client.updatePage(created.id, updateProps);
      const updated = pageToIncomeRecord(updatedPage);
      expect(updated.grossIncome).toBe(222.22);
      // untouched fields survive (proves the mapper-fix from C2)
      expect(updated.name).toBe(name);
      expect(updated.accountId).toBe(sampleAccountId);
      expect(updated.categoryId).toBe(sampleIncomeCategoryId);

      // ── Soft-delete (mimic notion.service.delete) ───────────────
      const softDeleteProps = incomeDtoToProperties({
        name: `${updated.name} [Deleted: ${updated.grossIncome}]`,
        grossIncome: 0,
      });
      const deletedPage = await client.updatePage(created.id, softDeleteProps);
      const deleted = pageToIncomeRecord(deletedPage);
      expect(deleted.name).toBe(`${name} [Deleted: 222.22]`);
      expect(deleted.grossIncome).toBe(0);
    },
    120_000,
  );

  it(
    'creates, updates, and soft-deletes an expense with conditional fields',
    async () => {
      const stamp = Date.now();
      const description = `G2 integration expense ${stamp}`;

      const createProps = expenseDtoToProperties({
        description,
        purchaseDate: '2026-07-09',
        amount: 333,
        interest: 0,
        accountId: sampleAccountId,
        categoryId: sampleExpenseCategoryId,
        paymentStatus: 'Unpaid',
      });
      const createdPage = await client.createPage('expenses', createProps);
      const created = pageToExpenseRecord(createdPage);
      expect(created.description).toBe(description);
      expect(created.amount).toBe(333);
      expect(created.paymentStatus).toBe('Unpaid');
      expect(created.accountId).toBe(sampleAccountId);
      expect(created.categoryId).toBe(sampleExpenseCategoryId);

      // Partial update — only paymentStatus + datePaid. Verifies the C2
      // mapper fix: description/amount/relations must not be clobbered.
      const updateProps = expenseDtoToProperties({
        paymentStatus: 'Paid',
        datePaid: '2026-07-09',
      });
      const updatedPage = await client.updatePage(created.id, updateProps);
      const updated = pageToExpenseRecord(updatedPage);
      expect(updated.paymentStatus).toBe('Paid');
      expect(updated.datePaid).toBe('2026-07-09');
      expect(updated.description).toBe(description);
      expect(updated.amount).toBe(333);
      expect(updated.accountId).toBe(sampleAccountId);
      expect(updated.categoryId).toBe(sampleExpenseCategoryId);

      // Soft-delete.
      const softDeleteProps = expenseDtoToProperties({
        description: `${updated.description} [Deleted: ${updated.amount}]`,
        amount: 0,
      });
      const deletedPage = await client.updatePage(created.id, softDeleteProps);
      const deleted = pageToExpenseRecord(deletedPage);
      expect(deleted.description).toBe(`${description} [Deleted: 333]`);
      expect(deleted.amount).toBe(0);
      // other fields still present
      expect(deleted.paymentStatus).toBe('Paid');
      expect(deleted.datePaid).toBe('2026-07-09');
    },
    120_000,
  );
});

if (skipReason) {
  // Emit a one-line hint at collection time so CI logs make it obvious the
  // integration suite was intentionally skipped rather than silently absent.
  // eslint-disable-next-line no-console
  console.warn(`[integration] skipped: ${skipReason}`);
}

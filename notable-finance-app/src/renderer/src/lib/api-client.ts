// Desktop data layer — a drop-in replacement for the web app's api-client that keeps the
// SAME exported surface (accountsApi, incomesApi, expensesApi, syncApi, …) but is backed by
// the local main process over `window.api.*` IPC instead of HTTP. This is the ONLY file that
// differs by transport; every ported component consumes it unchanged.
import type {
  Account,
  ExpenseCategory,
  ExpenseRecord,
  ExpenseSchedulerRecord,
  HistoryData,
  IncomeCategory,
  IncomeRecord,
  SyncStatus,
} from "@/types/finance";

export type ApiResult<TData> =
  | { success: true; data: TData; meta?: Record<string, unknown> }
  | { success: false; error: { code: string; message: string; details?: Record<string, unknown> } };

export type PullResource =
  | "accounts" | "incomeCategories" | "incomes" | "transactions" | "transfers"
  | "creditCardPayments" | "alkansya" | "receivables" | "expenseCategories"
  | "expenses" | "expenseScheduler";

const nfApi = () => window.api;

/** Map the main-process { ok, data|error } envelope to the web { success, data|error } one. */
async function adapt<T>(
  p: Promise<{ ok: true; data: T } | { ok: false; error: { code: string; message: string } }>,
): Promise<ApiResult<T>> {
  try {
    const r = await p;
    return r.ok
      ? { success: true, data: r.data }
      : { success: false, error: { code: r.error.code, message: r.error.message } };
  } catch (e) {
    return { success: false, error: { code: "E_IPC", message: e instanceof Error ? e.message : String(e) } };
  }
}

/** Same normalization for hand-rolled error paths. */
const err = (e: { code: string; message: string }): ApiResult<never> => ({
  success: false,
  error: { code: e.code, message: e.message },
});

const ok = <T>(data: T): ApiResult<T> => ({ success: true, data });

// ── Accounts ──────────────────────────────────────────────────────────
export type AccountsListParams = { includeInactive?: boolean };

export const accountsApi = {
  list(params?: AccountsListParams) {
    return adapt(nfApi().accounts.list({ includeInactive: params?.includeInactive })) as Promise<ApiResult<Account[]>>;
  },
  async detail(id: string): Promise<ApiResult<Account>> {
    const r = await nfApi().accounts.list({ includeInactive: true });
    if (!r.ok) return err(r.error);
    const found = r.data.find((a) => a.id === id);
    return found ? ok(found as Account) : { success: false, error: { code: "E_NOT_FOUND", message: "account not found" } };
  },
};

// ── Income Categories ─────────────────────────────────────────────────
export type IncomeCategoriesListParams = { normalOnly?: boolean };

export const incomeCategoriesApi = {
  async list(params?: IncomeCategoriesListParams): Promise<ApiResult<IncomeCategory[]>> {
    const r = await nfApi().categories.income();
    if (!r.ok) return err(r.error);
    let cats: IncomeCategory[] = r.data.map((c) => ({
      id: c.id, source: c.source, auxiliary: c.auxiliary, icon: c.icon ?? null,
      monthlyEarnings: 0, monthlyExpenditure: 0, monthlyGross: 0, earningPercentage: 0,
    }));
    if (params?.normalOnly) cats = cats.filter((c) => !c.auxiliary);
    return ok(cats);
  },
  async detail(id: string): Promise<ApiResult<IncomeCategory>> {
    const r = await this.list();
    if (!r.success) return r;
    const found = r.data.find((c) => c.id === id);
    return found ? ok(found) : { success: false, error: { code: "E_NOT_FOUND", message: "category not found" } };
  },
};

// ── Expense Categories ────────────────────────────────────────────────
export const expenseCategoriesApi = {
  async list(): Promise<ApiResult<ExpenseCategory[]>> {
    const r = await nfApi().categories.expense();
    if (!r.ok) return err(r.error);
    const cats: ExpenseCategory[] = r.data.map((c) => ({
      id: c.id, name: c.name, monthlyBudget: c.monthlyBudget, upcomingBudget: 0,
      auxiliary: c.auxiliary ? "Yes" : "No", icon: c.icon ?? null,
      spending: 0, remaining: 0, overview: "", totalOverview: 0,
    }));
    return ok(cats);
  },
  async detail(id: string): Promise<ApiResult<ExpenseCategory>> {
    const r = await this.list();
    if (!r.success) return r;
    const found = r.data.find((c) => c.id === id);
    return found ? ok(found) : { success: false, error: { code: "E_NOT_FOUND", message: "category not found" } };
  },
};

// ── Incomes ───────────────────────────────────────────────────────────
export type IncomesListParams = {
  month?: string; rangeStart?: string; rangeEnd?: string; categoryId?: string; accountId?: string;
};

const bulkCreateHelper = async <T>(items: unknown[], one: (item: unknown) => Promise<ApiResult<T>>) => {
  const created: T[] = [];
  const failed: { index: number; error: string }[] = [];
  for (let i = 0; i < items.length; i++) {
    const r = await one(items[i]);
    if (r.success) created.push(r.data);
    else failed.push({ index: i, error: r.error.message });
  }
  return ok({ created, failed });
};

export const incomesApi = {
  list(params?: IncomesListParams) {
    return adapt(nfApi().incomes.list({ ...params, view: "incomes" })) as Promise<ApiResult<IncomeRecord[]>>;
  },
  async detail(id: string): Promise<ApiResult<IncomeRecord>> {
    return adapt(nfApi().incomes.get(id)) as Promise<ApiResult<IncomeRecord>>;
  },
  create(body: Record<string, unknown>) {
    return adapt(nfApi().incomes.create(body as never)) as Promise<ApiResult<IncomeRecord>>;
  },
  bulkCreate(items: Record<string, unknown>[]) {
    return bulkCreateHelper<IncomeRecord>(items, (it) => this.create(it as Record<string, unknown>));
  },
  update(id: string, body: Record<string, unknown>) {
    return adapt(nfApi().incomes.update(id, body as never)) as Promise<ApiResult<IncomeRecord>>;
  },
  async bulkUpdate(ids: string[], patch: Record<string, unknown>) {
    const updated: IncomeRecord[] = [];
    const failed: { id: string; error: string }[] = [];
    for (const id of ids) {
      const r = await this.update(id, patch);
      if (r.success) updated.push(r.data);
      else failed.push({ id, error: r.error.message });
    }
    return ok({ updated, failed });
  },
  async delete(id: string, mode: "soft" | "hard" = "soft"): Promise<ApiResult<void>> {
    const r =
      mode === "hard"
        ? await nfApi().incomes.hardDelete(id)
        : await nfApi().incomes.softDelete(id);
    return r.ok ? ok(undefined as void) : err(r.error);
  },
  async bulkDelete(ids: string[], mode: "soft" | "hard" = "soft") {
    const deleted: string[] = [];
    const failed: { id: string; error: string }[] = [];
    for (const id of ids) {
      const r = await this.delete(id, mode);
      if (r.success) deleted.push(id);
      else failed.push({ id, error: r.error.message });
    }
    return ok({ deleted, failed });
  },
};

// ── Expenses ──────────────────────────────────────────────────────────
export type ExpensesListParams = {
  month?: string; rangeStart?: string; rangeEnd?: string; categoryId?: string; accountId?: string;
  paymentStatus?: string; expenseViewMode?: string; pasabuyer?: string;
};

export const expensesApi = {
  list(params?: ExpensesListParams) {
    return adapt(nfApi().expenses.list(params as never)) as Promise<ApiResult<ExpenseRecord[]>>;
  },
  async detail(id: string): Promise<ApiResult<ExpenseRecord>> {
    const r = await this.list();
    if (!r.success) return r;
    const found = r.data.find((x) => x.id === id);
    return found ? ok(found) : { success: false, error: { code: "E_NOT_FOUND", message: "expense not found" } };
  },
  create(body: Record<string, unknown>) {
    return adapt(nfApi().expenses.create(body as never)) as Promise<ApiResult<ExpenseRecord>>;
  },
  bulkCreate(items: Record<string, unknown>[]) {
    return bulkCreateHelper<ExpenseRecord>(items, (it) => this.create(it as Record<string, unknown>));
  },
  update(id: string, body: Record<string, unknown>) {
    return adapt(nfApi().expenses.update(id, body as never)) as Promise<ApiResult<ExpenseRecord>>;
  },
  async bulkUpdate(ids: string[], patch: Record<string, unknown>) {
    const updated: ExpenseRecord[] = [];
    const failed: { id: string; error: string }[] = [];
    for (const id of ids) {
      const r = await this.update(id, patch);
      if (r.success) updated.push(r.data);
      else failed.push({ id, error: r.error.message });
    }
    return ok({ updated, failed });
  },
  async delete(id: string, mode: "soft" | "hard" = "soft"): Promise<ApiResult<void>> {
    const r =
      mode === "hard"
        ? await nfApi().expenses.hardDelete(id)
        : await nfApi().expenses.softDelete(id);
    return r.ok ? ok(undefined as void) : err(r.error);
  },
  listForCCCoverage() {
    return adapt(nfApi().expenses.listForCCCoverage()) as Promise<ApiResult<ExpenseRecord[]>>;
  },
  async bulkDelete(ids: string[], mode: "soft" | "hard" = "soft") {
    const deleted: string[] = [];
    const failed: { id: string; error: string }[] = [];
    for (const id of ids) {
      const r = await this.delete(id, mode);
      if (r.success) deleted.push(id);
      else failed.push({ id, error: r.error.message });
    }
    return ok({ deleted, failed });
  },
};

// ── Workflows (income-backed views) ───────────────────────────────────
export type WorkflowListParams = { month?: string; rangeStart?: string; rangeEnd?: string; accountId?: string };

function workflowApi(view: "transfers" | "creditCardPayments" | "alkansya" | "receivables" | "incomes") {
  return {
    list(params?: WorkflowListParams) {
      return adapt(nfApi().incomes.list({ ...params, view } as never)) as Promise<ApiResult<IncomeRecord[]>>;
    },
    detail: (id: string) => incomesApi.detail(id),
    // Carry the workflow view so the server can resolve the locked income
    // category (Transfer / Credit Card Payment / Savings) when none is sent.
    create: (body: Record<string, unknown>) => incomesApi.create({ view, ...body }),
    bulkCreate: (items: Record<string, unknown>[]) =>
      incomesApi.bulkCreate(items.map((it) => ({ view, ...it }))),
    update: (id: string, body: Record<string, unknown>) => incomesApi.update(id, body),
    delete: (id: string, mode: "soft" | "hard" = "soft") => incomesApi.delete(id, mode),
    bulkDelete: (ids: string[], mode: "soft" | "hard" = "soft") => incomesApi.bulkDelete(ids, mode),
  };
}

export const transactionsApi = workflowApi("incomes");
export const transfersApi = workflowApi("transfers");
export const creditCardPaymentsApi = workflowApi("creditCardPayments");
export const alkansyaApi = workflowApi("alkansya");
export const receivablesApi = workflowApi("receivables");

// ── Monthly Monitoring / Dashboard / Scheduler ────────────────────────
export const monthlyMonitoringApi = {
  list(month?: string) {
    return adapt(nfApi().reports.monthlyMonitoring(month ?? new Date().toISOString().slice(0, 7)));
  },
};

export const dashboardApi = {
  // The desktop reports.dashboard returns the compact summary; pages compute the rich
  // dashboard client-side (same as web). Cast keeps the hook signature identical.
  summary(month: string) {
    return adapt(nfApi().reports.dashboard(month)) as unknown as Promise<
      ApiResult<import("@/types/finance").DashboardSummary>
    >;
  },
};

export const expenseSchedulerApi = {
  async list(): Promise<ApiResult<ExpenseSchedulerRecord[]>> {
    const r = await nfApi().expenseScheduler.list();
    if (!r.ok) return err(r.error);
    const rows: ExpenseSchedulerRecord[] = r.data.map((s) => ({
      id: s.id, description: s.title, amount: s.amount, nextDueDate: s.nextRunDate ?? "",
      frequency: s.frequency ?? "", category: s.categoryId ?? "", account: s.accountId ?? "",
      status: s.active ? "active" : "paused",
    }));
    return ok(rows);
  },
};

// ── Sync ──────────────────────────────────────────────────────────────
export interface PullLatestOptions { resources: PullResource[]; month?: string; viewMode?: string; accountId?: string }
export interface SyncCommitRequest {
  operations: Array<{ clientOperationId: string; resource: PullResource; action: "create" | "update" | "delete"; id?: string; data?: Record<string, unknown> }>;
  returnFreshSnapshot?: boolean; snapshotMonth?: string;
}

export const syncApi = {
  async status(): Promise<ApiResult<SyncStatus>> {
    const r = await nfApi().sync.status();
    if (!r.ok) return err(r.error);
    const s = r.data;
    const lastAt = s.lastPullAt ?? s.lastPushAt;
    return ok({
      lastSyncAt: lastAt ? new Date(lastAt).toISOString() : null,
      state: s.running ? "syncing" : s.lastError ? "error" : "idle",
      pendingOperations: s.dirtyCount,
      failedOperations: s.conflictCount,
    });
  },
  schemaStatus() {
    return adapt(nfApi().notion.verifySchema());
  },
  /** Full sync: pull then push (header Sync button default). */
  fullSync(since?: string) {
    return adapt(nfApi().sync.now(since));
  },
  /** Notion → App only. */
  pullOnly(since?: string) {
    return adapt(nfApi().sync.pull(since));
  },
  /** App → Notion only. */
  pushOnly() {
    return adapt(nfApi().sync.push());
  },
  // Desktop reads/writes are local-first; "pull latest" runs a full reconcile (pull+push).
  pullLatest(_options: PullLatestOptions) {
    return adapt(nfApi().sync.now());
  },
  // Local writes are already applied; a commit just triggers a full sync pass.
  commit(_body: SyncCommitRequest) {
    return adapt(nfApi().sync.now());
  },
};

// ── History (unsynced items + completed sync activity feed) ───────────
export const historyApi = {
  /** Unsynced items + events from the last `runs` sync passes (default 2). */
  get(runs?: number) {
    return adapt(nfApi().history.get(runs)) as Promise<ApiResult<HistoryData>>;
  },
  discardUnsynced(resource: "incomes" | "expenses", recordId: string) {
    return adapt(nfApi().history.discardUnsynced(resource, recordId)) as Promise<ApiResult<true>>;
  },
  getItemDetail(resource: "incomes" | "expenses", recordId: string) {
    return adapt(nfApi().history.getItemDetail(resource, recordId)) as Promise<ApiResult<Record<string, unknown> | null>>;
  },
};

// ── Preferences (stored locally; no cloud account) ────────────────────
export interface UserPreferences { showFab: boolean }
const FAB_KEY = "nf_show_fab";

export const preferencesApi = {
  get(): Promise<ApiResult<UserPreferences>> {
    let showFab = true;
    try { const v = localStorage.getItem(FAB_KEY); if (v !== null) showFab = v === "true"; } catch { /* ignore */ }
    return Promise.resolve(ok({ showFab }));
  },
  save(body: Partial<UserPreferences>): Promise<ApiResult<UserPreferences>> {
    const next = { showFab: body.showFab ?? true };
    try { localStorage.setItem(FAB_KEY, String(next.showFab)); } catch { /* ignore */ }
    return Promise.resolve(ok(next));
  },
};

// ── Notion config → the desktop's keychain-backed connection ──────────
export interface UserNotionConfig { configured: boolean; token: string; tokenConfigured: boolean; dbIds: Record<string, string> }

export const userNotionConfigApi = {
  async get(): Promise<ApiResult<UserNotionConfig>> {
    const [conn, mapping] = await Promise.all([nfApi().notion.isConnected(), nfApi().notion.getMapping()]);
    const configured = conn.ok ? conn.data : false;
    return ok({ configured, token: "", tokenConfigured: configured, dbIds: (mapping.ok ? mapping.data : {}) as Record<string, string> });
  },
  async save(body: { token?: string; dbIds?: Record<string, string> }): Promise<ApiResult<void>> {
    if (body.token) { const r = await nfApi().notion.connect(body.token); if (!r.ok) return err(r.error); }
    if (body.dbIds) { const r = await nfApi().notion.saveMapping(body.dbIds as never); if (!r.ok) return err(r.error); }
    return ok(undefined as void);
  },
  async remove(): Promise<ApiResult<void>> {
    const r = await nfApi().notion.disconnect();
    return r.ok ? ok(undefined as void) : err(r.error);
  },
};

// ── Legacy financeApi (backward compatibility) ────────────────────────
export const financeApi = {
  dashboardSummary(month: string) { return dashboardApi.summary(month); },
  syncStatus() { return syncApi.status(); },
  schemaStatus() { return syncApi.schemaStatus(); },
  pullLatest(options: PullLatestOptions) { return syncApi.pullLatest(options); },
};

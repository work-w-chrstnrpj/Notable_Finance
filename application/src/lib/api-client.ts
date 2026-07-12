import type {
  Account,
  DashboardSummary,
  ExpenseCategory,
  ExpenseRecord,
  ExpenseSchedulerRecord,
  IncomeCategory,
  IncomeRecord,
  SyncStatus,
} from "@/types/finance";

export type ApiResult<TData> =
  | {
      success: true;
      data: TData;
      meta?: Record<string, unknown>;
    }
  | {
      success: false;
      error: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
      };
    };

export type PullResource =
  | "accounts"
  | "incomeCategories"
  | "incomes"
  | "transactions"
  | "transfers"
  | "creditCardPayments"
  | "alkansya"
  | "receivables"
  | "expenseCategories"
  | "expenses"
  | "expenseScheduler";

export const backendApiBasePath =
  process.env.NEXT_PUBLIC_BACKEND_API_BASE_PATH ?? "/api/v1";

let authToken: string | null = null;

export function setAuthToken(t: string | null) {
  authToken = t;
}

export function getAuthToken(): string | null {
  return authToken;
}

export async function requestBackend<TData>(
  endpoint: string,
  init?: RequestInit,
): Promise<ApiResult<TData>> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };

  if (authToken) {
    headers.authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(`${backendApiBasePath}${endpoint}`, {
    ...init,
    headers,
  });

  // A 401 means the session is invalid/expired. Clear it and bounce to login
  // so a stale token never silently fails a write while GET requests keep
  // working via the backend's shared fallback.
  if (response.status === 401 && typeof window !== "undefined") {
    authToken = null;
    try {
      localStorage.removeItem("nf_token");
    } catch {
      // ignore
    }
    const path = window.location.pathname;
    if (path !== "/login" && path !== "/register") {
      window.location.href = "/login?session=expired";
    }
  }

  const payload = (await response.json()) as ApiResult<TData>;

  if (!response.ok && payload.success) {
    return {
      success: false,
      error: {
        code: "UNEXPECTED_RESPONSE",
        message: "The backend returned an unsuccessful HTTP status with a success payload.",
      },
    };
  }

  return payload;
}

// ── Accounts ──────────────────────────────────────────────────────────

export type AccountsListParams = {
  includeInactive?: boolean;
};

export const accountsApi = {
  list(params?: AccountsListParams) {
    const query = params?.includeInactive ? "?includeInactive=true" : "";
    return requestBackend<Account[]>(`/accounts${query}`);
  },
  detail(id: string) {
    return requestBackend<Account>(`/accounts/${encodeURIComponent(id)}`);
  },
};

// ── Income Categories ─────────────────────────────────────────────────

export type IncomeCategoriesListParams = {
  normalOnly?: boolean;
};

export const incomeCategoriesApi = {
  list(params?: IncomeCategoriesListParams) {
    const query = params?.normalOnly ? "?normalOnly=true" : "";
    return requestBackend<IncomeCategory[]>(`/income-categories${query}`);
  },
  detail(id: string) {
    return requestBackend<IncomeCategory>(`/income-categories/${encodeURIComponent(id)}`);
  },
};

// ── Expense Categories ────────────────────────────────────────────────

export const expenseCategoriesApi = {
  list() {
    return requestBackend<ExpenseCategory[]>("/expense-categories");
  },
  detail(id: string) {
    return requestBackend<ExpenseCategory>(`/expense-categories/${encodeURIComponent(id)}`);
  },
};

// ── Incomes ───────────────────────────────────────────────────────────

export type IncomesListParams = {
  month?: string;
  rangeStart?: string;
  rangeEnd?: string;
  categoryId?: string;
  accountId?: string;
};

export const incomesApi = {
  list(params?: IncomesListParams) {
    const query = buildQueryString(params);
    return requestBackend<IncomeRecord[]>(`/incomes${query}`);
  },
  detail(id: string) {
    return requestBackend<IncomeRecord>(`/incomes/${encodeURIComponent(id)}`);
  },
  create(body: Record<string, unknown>) {
    return requestBackend<IncomeRecord>("/incomes", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  update(id: string, body: Record<string, unknown>) {
    return requestBackend<IncomeRecord>(`/incomes/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },
  delete(id: string) {
    return requestBackend<void>(`/incomes/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },
};

// ── Expenses ──────────────────────────────────────────────────────────

export type ExpensesListParams = {
  month?: string;
  rangeStart?: string;
  rangeEnd?: string;
  categoryId?: string;
  accountId?: string;
  paymentStatus?: string;
  expenseViewMode?: string;
  pasabuyer?: string;
};

export const expensesApi = {
  list(params?: ExpensesListParams) {
    const query = buildQueryString(params);
    return requestBackend<ExpenseRecord[]>(`/expenses${query}`);
  },
  detail(id: string) {
    return requestBackend<ExpenseRecord>(`/expenses/${encodeURIComponent(id)}`);
  },
  create(body: Record<string, unknown>) {
    return requestBackend<ExpenseRecord>("/expenses", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  update(id: string, body: Record<string, unknown>) {
    return requestBackend<ExpenseRecord>(`/expenses/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },
  delete(id: string) {
    return requestBackend<void>(`/expenses/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },
};

// ── Transactions / Workflows (all income-backed views) ────────────────

export type WorkflowListParams = {
  month?: string;
  rangeStart?: string;
  rangeEnd?: string;
  accountId?: string;
};

function workflowApi(path: string) {
  return {
    list(params?: WorkflowListParams) {
      return requestBackend<IncomeRecord[]>(`${path}${buildQueryString(params)}`);
    },
    detail(id: string) {
      return requestBackend<IncomeRecord>(`${path}/${encodeURIComponent(id)}`);
    },
    create(body: Record<string, unknown>) {
      return requestBackend<IncomeRecord>(path, {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    update(id: string, body: Record<string, unknown>) {
      return requestBackend<IncomeRecord>(`${path}/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
    },
    delete(id: string) {
      return requestBackend<void>(`${path}/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    },
  };
}

export const transactionsApi = workflowApi("/transactions");
export const transfersApi = workflowApi("/transfers");
export const creditCardPaymentsApi = workflowApi("/credit-card-payments");
export const alkansyaApi = workflowApi("/alkansya");
export const receivablesApi = workflowApi("/receivables");

// ── Monthly Monitoring ────────────────────────────────────────────────

export const monthlyMonitoringApi = {
  list(month?: string) {
    const query = month ? `?month=${encodeURIComponent(month)}` : "";
    return requestBackend(`/monthly-monitoring${query}`);
  },
};

// ── Dashboard ─────────────────────────────────────────────────────────

export const dashboardApi = {
  summary(month: string) {
    return requestBackend<DashboardSummary>(
      `/dashboard/summary?month=${encodeURIComponent(month)}`,
    );
  },
};

// ── Expense Scheduler ─────────────────────────────────────────────────

export const expenseSchedulerApi = {
  list() {
    return requestBackend<ExpenseSchedulerRecord[]>("/expense-scheduler");
  },
};

// ── Sync ──────────────────────────────────────────────────────────────

export interface PullLatestOptions {
  resources: PullResource[];
  month?: string;
  viewMode?: string;
  accountId?: string;
}

export interface SyncCommitRequest {
  operations: Array<{
    clientOperationId: string;
    resource: PullResource;
    action: "create" | "update" | "delete";
    id?: string;
    data?: Record<string, unknown>;
  }>;
  returnFreshSnapshot?: boolean;
  snapshotMonth?: string;
}

export const syncApi = {
  status() {
    return requestBackend<SyncStatus>("/sync/status");
  },
  schemaStatus() {
    return requestBackend("/system/schema-status");
  },
  pullLatest(options: PullLatestOptions) {
    return requestBackend("/sync/pull", {
      method: "POST",
      body: JSON.stringify(options),
    });
  },
  commit(body: SyncCommitRequest) {
    return requestBackend("/sync/commit", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
};

// ── Auth ──────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface UserNotionConfig {
  configured: boolean;
  token: string;
  tokenConfigured: boolean;
  dbIds: Record<string, string>;
}

export const authApi = {
  login(body: LoginRequest) {
    return requestBackend<{ accessToken: string; user: AuthUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  register(body: RegisterRequest) {
    return requestBackend<{ accessToken: string; user: AuthUser }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  google(token: string) {
    return requestBackend<{ accessToken: string; user: AuthUser }>("/auth/google", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
  },
  logout() {
    return requestBackend<void>("/auth/logout", {
      method: "POST",
    });
  },
  me() {
    return requestBackend<AuthUser>("/auth/me");
  },
  changeEmail(body: { currentPassword: string; newEmail: string }) {
    return requestBackend<{ accessToken: string; user: AuthUser }>("/auth/email", {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },
  changePassword(body: { currentPassword: string; newPassword: string }) {
    return requestBackend<{ changed: boolean }>("/auth/password", {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },
  deleteAccount(body: { currentPassword: string }) {
    return requestBackend<{ deleted: boolean }>("/auth/account", {
      method: "DELETE",
      body: JSON.stringify(body),
    });
  },
};

export interface UserPreferences {
  showFab: boolean;
}

export const preferencesApi = {
  get() {
    return requestBackend<UserPreferences>("/user/preferences");
  },
  save(body: Partial<UserPreferences>) {
    return requestBackend<UserPreferences>("/user/preferences", {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },
};

export const userNotionConfigApi = {
  get() {
    return requestBackend<UserNotionConfig>("/user/notion-config");
  },
  save(body: { token?: string; dbIds?: Record<string, string> }) {
    return requestBackend<void>("/user/notion-config", {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },
  remove() {
    return requestBackend<void>("/user/notion-config", {
      method: "DELETE",
    });
  },
};

// ── Utility ───────────────────────────────────────────────────────────

function buildQueryString(params?: Record<string, string | undefined>): string {
  if (!params) {
    return "";
  }

  const entries = Object.entries(params).filter(
    ([, value]) => value !== undefined && value !== "",
  );

  if (entries.length === 0) {
    return "";
  }

  return `?${entries
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value!)}`,
    )
    .join("&")}`;
}

// ── Legacy financeApi (backward compatibility) ────────────────────────

/** @deprecated Use the resource-specific API objects instead. */
export const financeApi = {
  dashboardSummary(month: string) {
    return dashboardApi.summary(month);
  },
  syncStatus() {
    return syncApi.status();
  },
  schemaStatus() {
    return syncApi.schemaStatus();
  },
  pullLatest(options: PullLatestOptions) {
    return syncApi.pullLatest(options);
  },
};

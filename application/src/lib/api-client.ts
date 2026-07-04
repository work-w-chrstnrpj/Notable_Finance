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

export async function requestBackend<TData>(
  endpoint: string,
  init?: RequestInit,
): Promise<ApiResult<TData>> {
  const response = await fetch(`${backendApiBasePath}${endpoint}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...init?.headers,
    },
  });

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

export const financeApi = {
  dashboardSummary(month: string) {
    return requestBackend(`/dashboard/summary?month=${encodeURIComponent(month)}`);
  },
  syncStatus() {
    return requestBackend("/sync/status");
  },
  schemaStatus() {
    return requestBackend("/system/schema-status");
  },
  pullLatest(options: {
    month?: string;
    resources: PullResource[];
    viewMode?: string;
  }) {
    return requestBackend("/sync/pull", {
      method: "POST",
      body: JSON.stringify(options),
    });
  },
};

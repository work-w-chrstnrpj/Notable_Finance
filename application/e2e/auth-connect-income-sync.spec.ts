import { test, expect, request } from "@playwright/test";

/**
 * Group G / G1 — end-to-end critical path.
 *
 * Requires the backend running (E2E_BACKEND_URL, default http://localhost:3001)
 * with a live Neon DB. The frontend is booted by Playwright via the webServer
 * config (E2E_PORT, default 3100).
 *
 * The Sync button lives in the TopBar (always visible), so the test drives
 * everything from /dashboard to avoid the heavy /income data fetch.
 */

const BACKEND_URL = process.env.E2E_BACKEND_URL ?? "http://localhost:3001";

const NOTION_TOKEN =
  process.env.E2E_NOTION_TOKEN ??
  "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";

const NOTION_DB_IDS: Record<string, string> = {
  accounts:
    process.env.E2E_NOTION_ACCOUNTS_DB_ID ??
    "2f0a73e49a904eaeb09a445e74fb0aa3",
  incomeCategories:
    process.env.E2E_NOTION_INCOME_CATEGORIES_DB_ID ??
    "7f5873105223407da45f6ca0d6d1d6d8",
  incomes:
    process.env.E2E_NOTION_INCOMES_DB_ID ??
    "3d980251fd08465b87b19a1c9fbb1e12",
  expenseCategories:
    process.env.E2E_NOTION_EXPENSE_CATEGORIES_DB_ID ??
    "660ca9c39800438f8f2c7655e9a9c181",
  expenses:
    process.env.E2E_NOTION_EXPENSES_DB_ID ??
    "b038f7d88775495393ca3bad16aa1968",
  monthlyMonitoring:
    process.env.E2E_NOTION_MONTHLY_MONITORING_DB_ID ??
    "8c01091b6281475ebcd061c216b6caf6",
};

test.describe("critical path", () => {
  // Live Notion + Neon calls; give the run headroom.
  test.setTimeout(300_000);

  test("register → connect Notion → create income → sync", async ({
    page,
  }) => {
    const stamp = Date.now();
    const email = `g1-e2e-${stamp}@example.com`;
    const password = "G1E2ePw!Strong";

    // ── Register via UI ──────────────────────────────────────────────
    await page.goto("/register");
    await page.getByLabel(/name/i).fill("G1 E2E");
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole("button", { name: /create account/i }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 30_000 });

    // ── Connect Notion via UI ────────────────────────────────────────
    await page.goto("/notion-connect");
    await page.getByLabel(/notion integration token/i).fill(NOTION_TOKEN);
    for (const [key, id] of Object.entries(NOTION_DB_IDS)) {
      const rx = new RegExp(
        `${key.replace(/([A-Z])/g, " $1")} DB ID`,
        "i",
      );
      const input = page.getByLabel(rx);
      if (await input.count()) {
        await input.first().fill(id);
      }
    }
    await page
      .getByRole("button", { name: /save connection|update connection/i })
      .click();
    await page.waitForURL(/\/dashboard/, { timeout: 30_000 });

    // ── API cross-check + record creation ───────────────────────────
    const api = await request.newContext({ baseURL: BACKEND_URL });
    const loginRes = await api.post("/api/v1/auth/login", {
      data: { email, password },
    });
    expect(loginRes.ok(), "login should succeed").toBeTruthy();
    const jwt = (await loginRes.json()).data.accessToken as string;

    const configRes = await api.get("/api/v1/user/notion-config", {
      headers: { authorization: `Bearer ${jwt}` },
    });
    const config = (await configRes.json()).data;
    expect(config.configured).toBe(true);
    expect(config.tokenConfigured).toBe(true);
    expect(config.dbIds.accounts).toBe(NOTION_DB_IDS.accounts);

    const accountsRes = await api.get("/api/v1/accounts", {
      headers: { authorization: `Bearer ${jwt}` },
    });
    const accounts = (await accountsRes.json()).data as Array<{
      id: string;
      type: string;
      inactive: boolean;
    }>;
    const activeAccount = accounts.find(
      (a) => !a.inactive && a.type !== "Auxiliary",
    );
    expect(activeAccount, "at least one active non-Auxiliary account").toBeTruthy();

    const catsRes = await api.get("/api/v1/income-categories", {
      headers: { authorization: `Bearer ${jwt}` },
    });
    const categories = (await catsRes.json()).data as Array<{ id: string }>;
    expect(categories.length).toBeGreaterThan(0);

    const incomeMarker = `G1 e2e income ${stamp}`;
    const createRes = await api.post("/api/v1/incomes", {
      headers: { authorization: `Bearer ${jwt}` },
      data: {
        name: incomeMarker,
        date: "2026-07-09",
        grossIncome: 12.34,
        capitalExpenditure: 0,
        accountId: activeAccount!.id,
        categoryId: categories[0].id,
      },
    });
    expect(createRes.ok(), "income create should succeed").toBeTruthy();
    const createdIncome = (await createRes.json()).data;
    expect(createdIncome.name).toBe(incomeMarker);

    // ── Click Sync in the TopBar (visible from /dashboard) ──────────
    // The full pull round-trip against Notion takes minutes with 900+
    // incomes and 2900+ expenses. We validate the *wire*: the click fires
    // POST /sync/pull, backend accepts, and the UI shows the "Syncing"
    // state. The full snapshot round-trip is covered by C4.
    const syncButton = page.getByRole("button", { name: /^sync$/i });
    await expect(syncButton).toBeVisible();
    const pullRequest = page.waitForRequest(
      (req) =>
        req.url().includes("/api/v1/sync/pull") && req.method() === "POST",
      { timeout: 30_000 },
    );
    await syncButton.click();
    await pullRequest;

    // Give the syncing pill a chance to render before assertion.
    await expect(page.getByText(/syncing/i).first()).toBeVisible({
      timeout: 10_000,
    });

    // ── Cleanup: soft-delete the created record ─────────────────────
    const deleteRes = await api.delete(
      `/api/v1/incomes/${createdIncome.id}`,
      { headers: { authorization: `Bearer ${jwt}` } },
    );
    expect(deleteRes.ok()).toBeTruthy();
  });
});

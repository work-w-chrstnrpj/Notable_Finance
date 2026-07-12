"use client";

import { AlertTriangle, ArrowDownLeft, ArrowUpRight, ArrowUpDown, Banknote, CreditCard, PiggyBank, Receipt, RefreshCw, WalletCards } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLiveCollections } from "@/components/hooks";
import { EmptyState } from "@/components/ui";
import { MetricCard } from "@/components/ui";
import { categoryPalette, prototypeAccent } from "@/components/constants";
import { useExpenses, useIncomes, useWorkflowRecords } from "@/lib/use-data";
import { cx, getExpenseTotal, getMonthLabel } from "@/lib/finance-helpers";
import { formatMoney } from "@/lib/format";
import type { ExpenseRecord, IncomeRecord } from "@/types/finance";
import { SpendingBreakdownCard } from "@/components/charts";

function DashboardPage({
  lastSync,
  selectedMonth,
}: {
  lastSync: string;
  selectedMonth: string;
}) {
  const {
    creditActiveAccounts,
    nonCreditActiveAccounts,
    expenseCategories,
    accountNameById,
    expenseCategoryNameById,
  } = useLiveCollections();
  const { state: incomesState } = useIncomes({ month: selectedMonth });
  const { state: expensesState } = useExpenses({ month: selectedMonth });
  const { state: alkansyaState } = useWorkflowRecords("alkansya", {
    month: selectedMonth,
  });
  const { state: transferState } = useWorkflowRecords("transfer", {
    month: selectedMonth,
  });
  const { state: ccPaymentState } = useWorkflowRecords("credit-card-payment", {
    month: selectedMonth,
  });
  const monthLabel = getMonthLabel(selectedMonth);

  const monthIncomes: IncomeRecord[] = (
    incomesState.status === "success" ? incomesState.data : []
  ).filter((r) => !r.name?.includes("[Deleted:"));
  const monthExpenses: ExpenseRecord[] = (
    expensesState.status === "success" ? expensesState.data : []
  ).filter((r) => !r.description?.includes("[Deleted:"));
  const monthAlkansya: IncomeRecord[] = (
    alkansyaState.status === "success" ? alkansyaState.data : []
  ).filter((r) => !r.name?.includes("[Deleted:"));

  const monthlyGrossIncome = monthIncomes.reduce(
    (sum, r) => sum + r.grossIncome,
    0,
  );
  // Pasabuy expenses are paid on behalf of others ("pinasabay lang"), so they
  // are not part of the user's own monthly expense.
  const pasabuyCategoryIds = new Set(
    expenseCategories.filter((c) => /pasabuy/i.test(c.name)).map((c) => c.id),
  );
  const ownExpenses = monthExpenses.filter(
    (r) => !pasabuyCategoryIds.has(r.categoryId),
  );
  const monthlyExpenses = ownExpenses.reduce(
    (sum, r) => sum + r.amount + (r.interest ?? 0),
    0,
  );
  const alkansyaBalance = monthAlkansya.reduce(
    (sum, r) => sum + (r.grossIncome - r.capitalExpenditure),
    0,
  );

  const totalCashFlow = nonCreditActiveAccounts.reduce(
    (sum, a) => sum + (a.currentBalance ?? 0),
    0,
  );
  const availableCredit = creditActiveAccounts.reduce(
    (sum, a) => sum + (a.availableLimit ?? 0),
    0,
  );
  const creditLimit = creditActiveAccounts.reduce(
    (sum, a) => sum + (a.creditLimit ?? 0),
    0,
  );
  const creditBalanceTotal = creditActiveAccounts.reduce(
    (sum, a) => sum + (a.currentBalance ?? 0),
    0,
  );

  // #1 — Monthly Total CC Transactions: sum of expenses on a credit account.
  const creditAccountIds = new Set(creditActiveAccounts.map((a) => a.id));
  const monthlyCcTransactions = monthExpenses
    .filter((r) => creditAccountIds.has(r.accountId))
    .reduce((sum, r) => sum + r.amount + (r.interest ?? 0), 0);

  // #2 — Spending by category (with % of month's expense), used for both the
  // Spending Breakdown donut and the Top 5 Spending Category panel.
  // Pasabuy is a passthrough (someone else pays us back), not user spending —
  // exclude it so the breakdown reflects real category spend.
  const spendingBreakdown = expenseCategories
    .filter((cat) => !/pasabuy/i.test(cat.name))
    .map((cat) => {
      const value = monthExpenses
        .filter((r) => r.categoryId === cat.id)
        .reduce((sum, r) => sum + r.amount + (r.interest ?? 0), 0);
      return { name: cat.name, value };
    })
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value);

  const topSpendingCategories = spendingBreakdown.slice(0, 5).map((row) => ({
    name: row.name,
    value: row.value,
    percent: monthlyExpenses > 0 ? (row.value / monthlyExpenses) * 100 : 0,
  }));

  // #2 — Most Expensive Purchase of the Month (largest individual expenses).
  const topExpensePurchases = [...monthExpenses]
    .map((r) => ({
      id: r.id,
      description: r.description.replace(/\s*\[Deleted:.*\]/, ""),
      amount: r.amount + (r.interest ?? 0),
      category: expenseCategoryNameById.get(r.categoryId) ?? "—",
      account: accountNameById.get(r.accountId) ?? "—",
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const sectionPriority: Record<string, number> = {
    income: 0,
    "credit-card-payment": 1,
    expense: 2,
    transfer: 3,
  };

  const sectionMeta: Record<string, string> = {
    income: "Income",
    "credit-card-payment": "CC Payment",
    expense: "Expense",
    transfer: "Transfer",
  };

  const incomeItems = [...monthIncomes].map((r) => ({
    id: r.id,
    date: r.date,
    title: r.name.replace(/\s*\[Deleted:.*\]/, ""),
    section: "income",
    value: r.grossIncome - r.capitalExpenditure,
  }));

  const ccPaymentItems = (ccPaymentState.status === "success" ? ccPaymentState.data : [])
    .filter((r) => !r.name?.includes("[Deleted:"))
    .map((r) => ({
      id: r.id,
      date: r.date,
      title: r.name.replace(/\s*\[Deleted:.*\]/, ""),
      section: "credit-card-payment",
      value: r.grossIncome - r.capitalExpenditure,
    }));

  const expenseItems = [...monthExpenses].map((r) => ({
    id: r.id,
    date: r.purchaseDate,
    title: r.description.replace(/\s*\[Deleted:.*\]/, ""),
    section: "expense",
    value: -(r.amount + (r.interest ?? 0)),
  }));

  const transferItems = (transferState.status === "success" ? transferState.data : [])
    .filter((r) => !r.name?.includes("[Deleted:"))
    .map((r) => ({
      id: r.id,
      date: r.date,
      title: r.name.replace(/\s*\[Deleted:.*\]/, ""),
      section: "transfer",
      value: r.grossIncome - r.capitalExpenditure,
    }));

  const recentTransactions = [...incomeItems, ...ccPaymentItems, ...expenseItems, ...transferItems]
    .sort((a, b) => {
      if (b.date > a.date) return 1;
      if (b.date < a.date) return -1;
      return (sectionPriority[a.section] ?? 99) - (sectionPriority[b.section] ?? 99);
    })
    .slice(0, 5)
    .map((r) => ({
      id: r.id,
      date: r.date,
      title: r.title,
      meta: sectionMeta[r.section] ?? r.section,
      section: r.section,
      value: r.value,
      tone: r.value >= 0 ? ("green" as const) : ("rose" as const),
    }));

  const display = {
    totalCashFlow,
    monthlyGrossIncome,
    monthlyExpenses,
    alkansyaBalance,
    pendingOperations: monthExpenses.filter((r) => r.datePaid === null).length,
    lastSync,
    availableCredit,
    creditLimit,
    creditBalanceTotal,
    monthlyCcTransactions,
    spendingBreakdown,
    topSpendingCategories,
    topExpensePurchases,
    recentTransactions,
  };

  const spendingData = display.spendingBreakdown.length > 0
    ? display.spendingBreakdown.map((item) => ({
        name: item.name,
        value: item.value,
        color: categoryPalette[display.spendingBreakdown.indexOf(item) % categoryPalette.length],
      }))
    : [];

  const toneForValue = (value: number): "green" | "rose" => value >= 0 ? "green" : "rose";
  const recentData = display.recentTransactions.length > 0
    ? display.recentTransactions.map((item) => ({
        id: item.id,
        date: item.date,
        title: item.title,
        meta: item.meta,
        section: item.section,
        value: item.value,
        tone: toneForValue(item.value),
      }))
    : [];

  return (
    <div className="page-stack">
      <section className="metric-grid metric-grid--prototype">
        <MetricCard
          title="Total Cash Flow"
          value={formatMoney(display.totalCashFlow)}
          detail="Non-credit accounts"
          icon={WalletCards}
          tone="blue"
        />
        <MetricCard
          title="Monthly Income"
          value={formatMoney(display.monthlyGrossIncome)}
          detail={monthLabel}
          icon={Banknote}
          tone="green"
        />
        <MetricCard
          title="Monthly Expenses"
          value={formatMoney(display.monthlyExpenses)}
          detail={monthLabel}
          icon={Receipt}
          tone="rose"
        />
        <MetricCard
          title="Sync Queue"
          value={`${display.pendingOperations}`}
          detail={`Last sync ${display.lastSync}`}
          icon={RefreshCw}
          tone="amber"
        />
      </section>

      <section className="metric-grid metric-grid--prototype">
        <MetricCard
          title="Alkansya Balance"
          value={formatMoney(display.alkansyaBalance)}
          detail={monthLabel}
          icon={PiggyBank}
          tone="green"
        />
        <MetricCard
          title="Available Credit"
          value={formatMoney(display.availableCredit)}
          detail={`Limit ${formatMoney(display.creditLimit, { compact: true })}`}
          icon={CreditCard}
          tone="blue"
        />
        <MetricCard
          title="Monthly Total CC Transactions"
          value={formatMoney(display.monthlyCcTransactions)}
          detail={`${creditActiveAccounts.length} credit accounts · ${monthLabel}`}
          icon={CreditCard}
          tone="amber"
        />
        <MetricCard
          title="CC Balance Total"
          value={formatMoney(display.creditBalanceTotal)}
          detail={`${creditActiveAccounts.length} credit accounts`}
          icon={AlertTriangle}
          tone="rose"
        />
      </section>

      <section className="dashboard-chart-grid">
        <TopExpensePurchasesCard purchases={display.topExpensePurchases} monthLabel={monthLabel} />
        <SpendingBreakdownCard data={spendingData} monthLabel={monthLabel} />
      </section>

      <section className="dashboard-bottom-grid">
        <TopSpendingCategoriesCard categories={display.topSpendingCategories} monthLabel={monthLabel} />
        <RecentTransactionsList records={recentData} />
      </section>
    </div>
  );
}

function TopExpensePurchasesCard({
  purchases,
  monthLabel,
}: {
  purchases: Array<{
    id: string;
    description: string;
    amount: number;
    category: string;
    account: string;
  }>;
  monthLabel: string;
}) {
  // Rank ramp: #1 red → #5 yellow.
  const rankColors = ["#DC2626", "#EA580C", "#F97316", "#F59E0B", "#CA8A04"];

  return (
    <section className="dashboard-card">
      <div className="dashboard-card__header dashboard-card__header--stacked">
        <h2>Most Expensive Purchase of the Month</h2>
        <p>{monthLabel}</p>
      </div>
      {purchases.length === 0 ? (
        <EmptyState title="No expenses" detail="No expenses are scoped to this month." />
      ) : (
        <div className="top-expense-list">
          {purchases.map((p, index) => {
            const color = rankColors[index] ?? rankColors[rankColors.length - 1];
            return (
              <div key={p.id} className="top-expense-row">
                <span
                  className="top-expense-row__rank"
                  style={{ backgroundColor: color }}
                >
                  {index + 1}
                </span>
                <div className="top-expense-row__content">
                  <strong className="top-expense-row__title" style={{ color }}>
                    {p.description || "Untitled"}
                  </strong>
                  <div className="top-expense-row__meta">
                    <span>{p.category} · {p.account}</span>
                    <strong>{formatMoney(p.amount)}</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function TopSpendingCategoriesCard({
  categories,
  monthLabel,
}: {
  categories: Array<{ name: string; value: number; percent: number }>;
  monthLabel: string;
}) {
  return (
    <section className="dashboard-card">
      <div className="dashboard-card__header dashboard-card__header--stacked">
        <h2>Top 5 Spending Category</h2>
        <p>{monthLabel}</p>
      </div>
      {categories.length === 0 ? (
        <EmptyState title="No spending" detail="No expenses are scoped to this month." />
      ) : (
        <div className="budget-usage-list">
          {categories.map((cat) => {
            const percent = Math.round(cat.percent);
            const color = percent > 50 ? "#E11D48" : percent > 25 ? "#D97706" : prototypeAccent;
            return (
              <div key={cat.name} className="budget-usage-row">
                <div>
                  <span>{cat.name}</span>
                  <strong>{formatMoney(cat.value, { compact: true })} · {percent}%</strong>
                </div>
                <div className="budget-usage-track">
                  <i style={{ width: `${Math.min(percent, 100)}%`, backgroundColor: color }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function RecentTransactionsList({
  records,
}: {
  records: Array<{
    id: string;
    title: string;
    meta: string;
    section: string;
    value: number;
    tone: "green" | "rose";
  }>;
}) {
  const iconMap: Record<string, LucideIcon> = {
    income: ArrowUpRight,
    expense: ArrowDownLeft,
    transfer: ArrowUpDown,
    "credit-card-payment": CreditCard,
  };

  return (
    <section className="dashboard-card recent-list-card">
      <div className="recent-list-card__header">
        <h2>Recent Transactions</h2>
      </div>
      <div className="recent-list">
        {records.map((record) => {
          const Icon = iconMap[record.section] ?? ArrowUpRight;
          const prefix = record.value > 0 ? "+" : "-";

          return (
            <button type="button" className="recent-list__row" key={record.id}>
              <span className={cx("recent-list__icon", `recent-list__icon--${record.tone}`)}>
                <Icon size={16} />
              </span>
              <span className="recent-list__copy">
                <span>{record.title}</span>
                <span>{record.meta}</span>
              </span>
              <span className={cx("recent-list__amount", `recent-list__amount--${record.section}`)}>
                {prefix}
                {formatMoney(Math.abs(record.value), { compact: true })}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export { DashboardPage, TopExpensePurchasesCard, TopSpendingCategoriesCard, RecentTransactionsList };

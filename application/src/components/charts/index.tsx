"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMoney } from "@/lib/format";
import { EmptyState } from "@/components/ui";
import { ANNUAL_MONTHS, type AnnualGroupBy, type AnnualRecord } from "@/components/constants";

// ── Spending Breakdown Card ──────────────────────────────────────────

export function SpendingBreakdownCard({
  data,
  monthLabel,
}: {
  data: Array<{ name: string; value: number; color: string }>;
  monthLabel: string;
}) {
  return (
    <section className="dashboard-card dashboard-card--spending">
      <div className="dashboard-card__header dashboard-card__header--stacked">
        <h2>Spending Breakdown</h2>
        <p>{monthLabel}</p>
      </div>
      <div className="spending-donut" aria-label="Spending breakdown donut chart">
        {data.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                cx="50%"
                cy="50%"
                data={data}
                dataKey="value"
                innerRadius={47}
                isAnimationActive={false}
                outerRadius={76}
                stroke="none"
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid rgba(28,25,23,0.09)",
                  borderRadius: 10,
                  fontSize: 12,
                }}
                formatter={(value) => formatMoney(Number(value))}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState title="No spending" detail="No expenses are scoped to this month." />
        )}
      </div>
      <div className="spending-list">
        {data.map((item) => (
          <div key={item.name} className="spending-list__row">
            <span><i style={{ backgroundColor: item.color }} />{item.name}</span>
            <strong>{formatMoney(item.value, { compact: true })}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Annually chart (Income + Expense) ─────────────────────────────────

export function buildAnnualGroups(
  records: AnnualRecord[],
  groupBy: AnnualGroupBy,
  accountNameById: Map<string, string>,
  categoryNameById: Map<string, string>,
): Array<{ label: string; value: number }> {
  if (groupBy === "month") {
    const sums = new Array(12).fill(0) as number[];
    for (const r of records) {
      const m = Number((r.dateIso || "").slice(5, 7)) - 1;
      if (m >= 0 && m < 12) sums[m] += r.value;
    }
    return ANNUAL_MONTHS.map((label, i) => ({ label, value: sums[i] }));
  }
  const nameById = groupBy === "account" ? accountNameById : categoryNameById;
  const sums = new Map<string, number>();
  for (const r of records) {
    const key = (groupBy === "account" ? r.accountId ?? "" : r.categoryId) || "—";
    sums.set(key, (sums.get(key) ?? 0) + r.value);
  }
  return [...sums.entries()]
    .map(([key, value]) => ({ label: nameById.get(key) ?? "—", value }))
    .sort((a, b) => b.value - a.value);
}

export function GroupBySelect({
  value,
  onChange,
}: {
  value: AnnualGroupBy;
  onChange: (v: AnnualGroupBy) => void;
}) {
  return (
    <label className="group-by">
      <select value={value} onChange={(e) => onChange(e.target.value as AnnualGroupBy)}>
        <option value="month">Group by Month</option>
        <option value="account">Group by Account</option>
        <option value="category">Group by Category</option>
      </select>
    </label>
  );
}

export function AnnualBarChart({
  data,
  color,
}: {
  data: Array<{ label: string; value: number }>;
  color: string;
}) {
  if (!data.some((d) => d.value !== 0)) {
    return <EmptyState title="No data" detail="Nothing to chart for this year." />;
  }
  const rotated = data.length > 6;
  return (
    <div className="annual-chart" aria-label="Annual bar chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(28,25,23,0.06)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#79716B" }}
            tickLine={false}
            axisLine={false}
            interval={0}
            angle={rotated ? -35 : 0}
            textAnchor={rotated ? "end" : "middle"}
            height={rotated ? 78 : 28}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#79716B" }}
            tickLine={false}
            axisLine={false}
            width={52}
            tickFormatter={(v) => `₱${(Number(v) / 1000).toFixed(0)}k`}
          />
          <Tooltip
            cursor={{ fill: "rgba(28,25,23,0.05)" }}
            formatter={(v) => [formatMoney(Number(v)), ""]}
            contentStyle={{
              backgroundColor: "#FFFFFF",
              border: "1px solid rgba(28,25,23,0.09)",
              borderRadius: 10,
              fontSize: 12,
            }}
          />
          <Bar dataKey="value" fill={color} radius={[5, 5, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Category Donut Chart ─────────────────────────────────────────────

export function CategoryDonutChart({
  data,
}: {
  data: Array<{ name: string; value: number; color: string }>;
}) {
  return (
    <div className="category-chart">
      <div className="category-chart__visual" aria-label="Category chart">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              cx="50%"
              cy="50%"
              data={data}
              dataKey="value"
              innerRadius={54}
              isAnimationActive={false}
              outerRadius={86}
              stroke="none"
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#FFFFFF",
                border: "1px solid rgba(28,25,23,0.09)",
                borderRadius: 10,
                fontSize: 12,
              }}
              formatter={(value) => formatMoney(Number(value))}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="category-chart__legend">
        {data.map((item) => (
          <div key={item.name}>
            <span><i style={{ backgroundColor: item.color }} />{item.name}</span>
            <strong>{formatMoney(item.value, { compact: true })}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

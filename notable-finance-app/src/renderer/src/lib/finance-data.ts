import type { FinanceSection, FinanceSectionId } from "@/types/finance";

export const financeSections: FinanceSection[] = [
  { id: "dashboard", label: "Dashboard", group: "primary" },
  { id: "accounts", label: "Accounts", group: "primary" },
  { id: "income", label: "Income", group: "primary" },
  { id: "expense", label: "Expense", group: "primary" },
  { id: "monthly-monitoring", label: "Monthly Monitoring", shortLabel: "Monitoring", group: "primary" },
  { id: "transfer", label: "Transfer", group: "workflow" },
  { id: "credit-card-payment", label: "Credit Card Payment", shortLabel: "CC Payment", group: "workflow" },
  { id: "alkansya", label: "Alkansya", group: "workflow" },
  { id: "receivables", label: "Receivables", group: "workflow" },
  { id: "sync", label: "Sync Center", shortLabel: "Sync", group: "system" },
  { id: "settings", label: "Settings", group: "system" },
];

export function getSectionById(section: string) {
  return financeSections.find((item) => item.id === section);
}
export function getAccountName(id: string | null) {
  return id ?? "—";
}

export function getAccountType(id: string | null) {
  return id ?? "Cash";
}

export function getIncomeCategoryName(id: string) {
  return id ?? "—";
}

export function getExpenseCategoryName(id: string) {
  return id ?? "—";
}

export function getActiveSectionLabel(id: FinanceSectionId) {
  return financeSections.find((section) => section.id === id)?.label ?? "Dashboard";
}

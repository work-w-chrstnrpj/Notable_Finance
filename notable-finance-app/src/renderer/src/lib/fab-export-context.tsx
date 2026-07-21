
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/** A single printable line on the receipt. */
export type ReceiptRow = {
  date: string;
  description: string;
  amount: string;
  /** Installment breakdown fields (optional — present only in installment layout). */
  grossAmount?: string;
  paidAmount?: string;
  remainingBalance?: string;
  installmentAmount?: string;
  expectedPaymentDate?: string;
};

/**
 * Published by the Expense view so the floating action button can render a
 * receipt for whatever is currently on screen (view mode + active filters).
 * The amount column is remapped per view — see the Expense page.
 */
export type ReceiptContext = {
  /** e.g. "Monthly Expenses", "Unpaid Pasabuy". */
  viewTitle: string;
  /** Human month/period label, e.g. "July 2026". */
  periodLabel: string;
  /** Header for the amount column ("Amount" or "Installment Amount"). */
  amountHeader: string;
  rows: ReceiptRow[];
  total: string;
  /** When true, render as breakdown cards instead of table rows. */
  installmentLayout?: boolean;
};

/**
 * Published by the Monthly Monitoring view so the FAB can capture an image of
 * the live UI (headers + MMMM YYYY), stripped of nav/toggle/filter chrome.
 */
export type InsightContext = {
  monthLabel: string;
  /** Returns the DOM node to snapshot, or null if not mounted yet. */
  getNode: () => HTMLElement | null;
};

/** Stable setters — pages register through these without re-rendering. */
type FabRegisterValue = {
  setReceipt: (value: ReceiptContext | null) => void;
  setInsight: (value: InsightContext | null) => void;
};

/** Live data — the FAB reads through this. */
type FabDataValue = {
  receipt: ReceiptContext | null;
  insight: InsightContext | null;
};

const FabRegisterContext = createContext<FabRegisterValue | null>(null);
const FabDataContext = createContext<FabDataValue | null>(null);

export function FabExportProvider({ children }: { children: ReactNode }) {
  const [receipt, setReceipt] = useState<ReceiptContext | null>(null);
  const [insight, setInsight] = useState<InsightContext | null>(null);

  // Setters are referentially stable, so registrant pages never re-render from
  // context — that avoids a set → re-render → recompute → set feedback loop.
  const register = useMemo<FabRegisterValue>(
    () => ({ setReceipt, setInsight }),
    [],
  );
  const data = useMemo<FabDataValue>(
    () => ({ receipt, insight }),
    [receipt, insight],
  );

  return (
    <FabRegisterContext.Provider value={register}>
      <FabDataContext.Provider value={data}>{children}</FabDataContext.Provider>
    </FabRegisterContext.Provider>
  );
}

/** For pages that publish receipt/insight data (Expense, Monitoring). */
export function useFabRegister(): FabRegisterValue {
  const ctx = useContext(FabRegisterContext);
  if (!ctx) {
    throw new Error("useFabRegister must be used within a FabExportProvider");
  }
  return ctx;
}

/** For the FAB, which reads the currently published data. */
export function useFabExport(): FabDataValue {
  const ctx = useContext(FabDataContext);
  if (!ctx) {
    throw new Error("useFabExport must be used within a FabExportProvider");
  }
  return ctx;
}

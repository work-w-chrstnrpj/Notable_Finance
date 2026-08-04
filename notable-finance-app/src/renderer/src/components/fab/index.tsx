
import { useState } from "react";
import { ArrowUpRight, Camera, Plus, Printer, Receipt } from "lucide-react";
import { useFabExport } from "@/lib/fab-export-context";
import { cx } from "@/lib/finance-helpers";
import { QuickAddIncomeModal } from "./quick-add-income-modal";
import { QuickAddExpenseModal } from "./quick-add-expense-modal";
import { ReceiptModal } from "./receipt-modal";
import { InsightShotModal } from "./insight-shot-modal";
import type { FinanceSectionId } from "@/types/finance";

// ── Floating action button ────────────────────────────────────────────

type FabModalKind = "income" | "expense" | "receipt" | "insight" | null;

/**
 * The FAB shell: toggle button, quick-action menu, and modal dispatch. The four
 * quick-add / export modals it can open live in their own files (refactor_development_plan.md
 * Phase 6.3 — separates the shell from what it carries).
 */
function WorkspaceFab({
  activeSection,
  selectedDate,
}: {
  activeSection: FinanceSectionId;
  selectedDate: string;
}) {
  const { receipt, insight } = useFabExport();
  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState<FabModalKind>(null);

  const canPrintReceipt =
    (activeSection === "expense" || activeSection === "receivables") && receipt !== null;
  const canShotInsight = activeSection === "monthly-monitoring" && insight !== null;

  function choose(kind: Exclude<FabModalKind, null>) {
    setOpen(false);
    setModal(kind);
  }

  return (
    <>
      <div className="fab">
        {open && (
          <div className="fab__menu" role="menu">
            <button type="button" className="fab__action" onClick={() => choose("income")}>
              <span className="fab__action-label">Add New Income</span>
              <span className="fab__action-icon fab__action-icon--income">
                <ArrowUpRight size={18} />
              </span>
            </button>
            <button type="button" className="fab__action" onClick={() => choose("expense")}>
              <span className="fab__action-label">Add New Expense</span>
              <span className="fab__action-icon fab__action-icon--expense">
                <Receipt size={18} />
              </span>
            </button>
            {canPrintReceipt && (
              <button type="button" className="fab__action" onClick={() => choose("receipt")}>
                <span className="fab__action-label">Print Receipt</span>
                <span className="fab__action-icon">
                  <Printer size={18} />
                </span>
              </button>
            )}
            {canShotInsight && (
              <button type="button" className="fab__action" onClick={() => choose("insight")}>
                <span className="fab__action-label">{insight.viewLabel}</span>
                <span className="fab__action-icon">
                  <Camera size={18} />
                </span>
              </button>
            )}
          </div>
        )}
        <button
          type="button"
          className={cx("fab__toggle", open && "fab__toggle--open")}
          aria-label={open ? "Close quick actions" : "Open quick actions"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <Plus size={24} />
        </button>
      </div>

      {open && (
        <div
          className="fab__backdrop"
          role="presentation"
          onClick={() => setOpen(false)}
        />
      )}

      {modal === "income" && (
        <QuickAddIncomeModal onClose={() => setModal(null)} />
      )}
      {modal === "expense" && (
        <QuickAddExpenseModal
          selectedDate={selectedDate}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "receipt" && receipt && (
        <ReceiptModal receipt={receipt} onClose={() => setModal(null)} />
      )}
      {modal === "insight" && insight && (
        <InsightShotModal insight={insight} onClose={() => setModal(null)} />
      )}
    </>
  );
}

export { WorkspaceFab, QuickAddIncomeModal, QuickAddExpenseModal, ReceiptModal, InsightShotModal };
export type { FabModalKind };

import { useRef } from "react";
import { cx } from "@/lib/finance-helpers";
import { useAuth } from "@/lib/auth-context";
import { type ReceiptContext } from "@/lib/fab-export-context";
import { downloadNodeAsPng, printNode } from "@/lib/export-node";
import { ExportModalShell } from "@/components/export/export-modal-shell";
import styles from "./receipt-modal.module.css";

/**
 * Print Receipt export for the FAB (refactor_development_plan.md Phase 6.3 — pure move out
 * of fab/index.tsx, unchanged).
 */
function ReceiptModal({
  receipt,
  onClose,
}: {
  receipt: ReceiptContext;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const surfaceRef = useRef<HTMLDivElement>(null);

  return (
    <ExportModalShell
      title="Print Receipt"
      subtitle="Export the current view as a receipt."
      onClose={onClose}
      onPrint={() => surfaceRef.current && printNode(surfaceRef.current)}
      onSaveImage={() =>
        surfaceRef.current && downloadNodeAsPng(surfaceRef.current, "notable-receipt")
      }
    >
      <div
        className={`${styles.receipt}${receipt.installmentLayout ? " " + styles["receipt--installment"] : ""}`}
        ref={surfaceRef}
        style={{ fontFamily: "var(--font-receipt)" }}
      >
        <div className={styles.receipt__head}>
          <h1 className={styles.receipt__brand}>Notable Finance Receipt</h1>
          <p className={styles.receipt__tagline}>by {user?.name ?? user?.email ?? "Guest"}</p>
          <p className={styles.receipt__meta}>{receipt.periodLabel}</p>
        </div>
        <div className={styles.receipt__rule} />
        {receipt.installmentLayout ? (
          <div className={styles.receipt__breakdowns}>
            {receipt.rows.length === 0 ? (
              <p className={styles.receipt__empty}>No items to display.</p>
            ) : (
              receipt.rows.map((row, index) => (
                <div className={styles.receipt__breakdown} key={`${row.date}-${index}`}>
                  <span className={styles["receipt__breakdown-label"]}>Item name:</span>
                  <span className={styles["receipt__breakdown-dots"]} />
                  <span className={styles["receipt__breakdown-value"]}>{row.description}</span>

                  <span className={styles["receipt__breakdown-label"]}>Date of Purchase:</span>
                  <span className={styles["receipt__breakdown-dots"]} />
                  <span className={styles["receipt__breakdown-value"]}>{row.date}</span>

                  <span className={styles["receipt__breakdown-label"]}>Gross Amount:</span>
                  <span className={styles["receipt__breakdown-dots"]} />
                  <span className={styles["receipt__breakdown-value"]}>{row.grossAmount ?? row.amount}</span>

                  <span className={cx(styles["receipt__breakdown-label"], styles["receipt__breakdown-label--indent"])}>Paid Amount:</span>
                  <span className={styles["receipt__breakdown-dots"]} />
                  <span className={cx(styles["receipt__breakdown-value"], styles["receipt__breakdown-value--green"])}>{row.paidAmount ?? "—"}</span>

                  <span className={cx(styles["receipt__breakdown-label"], styles["receipt__breakdown-label--indent"])}>Remaining Balance:</span>
                  <span className={styles["receipt__breakdown-dots"]} />
                  <span className={cx(styles["receipt__breakdown-value"], styles["receipt__breakdown-value--red"])}>{row.remainingBalance ?? "—"}</span>

                  <span className={styles["receipt__breakdown-label"]}>Installment Amount:</span>
                  <span className={styles["receipt__breakdown-dots"]} />
                  <span className={styles["receipt__breakdown-value"]}>{row.installmentAmount ?? "—"}</span>

                  <span className={styles["receipt__breakdown-label"]}>Expected Date of Payment:</span>
                  <span className={styles["receipt__breakdown-dots"]} />
                  <span className={styles["receipt__breakdown-value"]}>{row.expectedPaymentDate ?? "—"}</span>

                  {index < receipt.rows.length - 1 && <div className={styles["receipt__breakdown-divider"]} />}
                </div>
              ))
            )}
          </div>
        ) : (
          <>
            <table className={styles.receipt__table}>
              <colgroup>
                <col className={styles["receipt__col-date"]} />
                <col className={styles["receipt__col-desc"]} />
                <col className={styles["receipt__col-amount"]} />
              </colgroup>
              <thead>
                <tr>
                  <th>Date of Purchase</th>
                  <th>Description</th>
                  <th className={styles.receipt__amount}>{receipt.amountHeader}</th>
                </tr>
              </thead>
              <tbody>
                {receipt.rows.length === 0 ? (
                  <tr>
                    <td colSpan={3} className={styles.receipt__empty}>No items to display.</td>
                  </tr>
                ) : (
                  receipt.rows.map((row, index) => (
                    <tr key={`${row.date}-${index}`}>
                      <td className={styles.receipt__date}>{row.date}</td>
                      <td>{row.description}</td>
                      <td className={styles.receipt__amount}>{row.amount}</td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2}>Total</td>
                  <td className={styles.receipt__amount}>{receipt.total}</td>
                </tr>
              </tfoot>
            </table>
            <div className={styles.receipt__rule} />
            <p className={styles.receipt__disclaimer}>
              This document is electronically generated.
            </p>
          </>
        )}
        {receipt.installmentLayout && (
          <>
            <div className={styles.receipt__rule} />
            <div className={styles["receipt__breakdown-total"]}>
              <span>Total Installment Amount:</span>
              <span>{receipt.total}</span>
            </div>
            <p className={styles.receipt__disclaimer}>
              This document is electronically generated.
            </p>
          </>
        )}
      </div>
    </ExportModalShell>
  );
}

export { ReceiptModal };

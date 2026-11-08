import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Check, X } from "lucide-react";
import {
  isCreditLikeAccountType,
  isPasabuyCategoryName,
  pasabuyStatusLabels,
  paymentFrequencyLabels,
  paymentStatusLabels,
} from "@/lib/finance-rules";
import { cx } from "@/lib/finance-helpers";
import styles from "./draft-card.module.css";
import type {
  AccountDto,
  ChatDraftDto,
  ExpenseCategoryOption,
  IncomeCategoryOption,
} from "@shared/finance.types";

/** Kinds whose category is fixed by the workflow (locked in the validator). */
const CATEGORY_LOCKED_KINDS = new Set([
  "proposeCreateTransfer",
  "proposeCreateCcPayment",
  "proposeCreateAlkansya",
]);
/** Kinds that move money between two accounts (need a second account field). */
const TRANSACTED_KINDS = new Set(["proposeCreateTransfer", "proposeCreateCcPayment"]);

type DraftForm = {
  name: string;
  amount: string;
  date: string;
  accountId: string;
  categoryId: string;
  transactedAccountId: string;
  datePaid: string;
  interest: string;
  paidPeriod: string;
  pasabuyDateOfPayment: string;
  pasabuyPaidPeriod: string;
  pasabuyAccountReceiverId: string;
  paymentStatus: string;
  paymentFrequency: string;
  periodCount: string;
  bnplAdjustment: string;
  pasabuyer: string;
  pasabuyStatus: string;
};

function draftToForm(d: ChatDraftDto): DraftForm {
  const p = d.payload as Record<string, unknown>;
  const isIncome = d.resource === "incomes";
  const s = (v: unknown): string => (v == null ? "" : String(v));
  return {
    name: s(isIncome ? p.name : p.description),
    amount: s(isIncome ? p.grossIncome : p.amount),
    date: s(isIncome ? p.date : p.purchaseDate),
    accountId: s(p.accountId),
    categoryId: s(p.categoryId),
    transactedAccountId: s(p.transactedAccountId),
    datePaid: s(p.datePaid),
    interest: s(p.interest),
    paidPeriod: s(p.paidPeriod),
    pasabuyDateOfPayment: s(p.pasabuyDateOfPayment),
    pasabuyPaidPeriod: s(p.pasabuyPaidPeriod),
    pasabuyAccountReceiverId: s(p.pasabuyAccountReceiverId),
    paymentStatus: d.missingRequired.includes("Payment Status") ? "" : s(p.paymentStatus),
    paymentFrequency: s(p.paymentFrequency),
    periodCount: s(p.periodCount),
    bnplAdjustment: s(p.bnplAdjustment),
    pasabuyer: s(p.pasabuyer),
    pasabuyStatus: s(p.pasabuyStatus),
  };
}

type DraftCardProps = {
  draft: ChatDraftDto;
  accounts: AccountDto[];
  incomeCategories: IncomeCategoryOption[];
  expenseCategories: ExpenseCategoryOption[];
  busy: boolean;
  needsKey: boolean;
  onEdit: (draftId: string, edits: Record<string, unknown>) => void | Promise<void>;
  onApprove: (draftId: string) => void | Promise<void>;
  onCancel: (draftId: string) => void | Promise<void>;
};

/**
 * Inline-editable confirm card. Fields recompute server-side on blur / change so
 * `missingRequired` and the Ready state stay authoritative — Approve unlocks the
 * moment the record is complete, with no extra prompt needed.
 * refactor_development_plan.md Phase 6.2 — pure move out of chat.tsx, unchanged.
 */
function DraftCard({
  draft,
  accounts,
  incomeCategories,
  expenseCategories,
  busy,
  needsKey,
  onEdit,
  onApprove,
  onCancel,
}: DraftCardProps) {
  const isIncome = draft.resource === "incomes";
  const isMassUpdate = draft.kind.startsWith("proposeMassUpdate");
  const ready = draft.status === "ready" && draft.missingRequired.length === 0;
  const editable =
    !isMassUpdate && draft.status !== "applied" && draft.status !== "cancelled";
  const dsp = draft.display ?? null;

  const [form, setForm] = useState<DraftForm>(() => draftToForm(draft));
  // Re-sync from the validated server draft after each edit (inputs are already
  // blurred by then, so this never fights the cursor).
  const sig = `${JSON.stringify(draft.payload)}::${draft.status}`;
  useEffect(() => {
    setForm(draftToForm(draft));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- resync on validated payload only
  }, [sig]);

  const profile = (draft.payload._profile ?? {}) as { creditCard?: boolean };
  const account = accounts.find((item) => item.id === form.accountId);
  const category = expenseCategories.find((item) => item.id === form.categoryId);
  const showCc = draft.resource === "expenses" &&
    (account ? isCreditLikeAccountType(account.type) : profile.creditCard === true);
  const showPasabuy = draft.resource === "expenses" &&
    (category ? isPasabuyCategoryName(category.name) : draft.payload.isPasabuy === true);
  const showCategory = !CATEGORY_LOCKED_KINDS.has(draft.kind);
  const showTransacted = TRANSACTED_KINDS.has(draft.kind);
  const isCcPayment = draft.kind === "proposeCreateCcPayment";

  const categoryOptions = isIncome
    ? incomeCategories
        .filter((c) => !c.auxiliary)
        .map((c) => ({ id: c.id, label: c.source }))
    : expenseCategories.map((c) => ({ id: c.id, label: c.name }));
  const accountOptions = accounts
    .filter((a) => a.notionSynced)
    .map((a) => ({ id: a.id, label: a.name }));

  const setField = (key: keyof DraftForm, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const commit = (editKey: string, value: string) => {
    void onEdit(draft.id, { [editKey]: value });
  };
  /** Commit only when a text/number/date field actually changed on blur. */
  const commitIfChanged = (key: keyof DraftForm, editKey: string) => {
    if (form[key] !== draftToForm(draft)[key]) commit(editKey, form[key]);
  };

  function expenseInput(key: keyof DraftForm, label: string, type: "number" | "date", step?: string) {
    return (
      <label className={styles["chat-field"]}>
        <span className={styles["chat-field__label"]}>{label}</span>
        <input
          className={styles["chat-field__input"]}
          type={type}
          step={step}
          value={form[key]}
          disabled={busy}
          onChange={(event) => setField(key, event.target.value)}
          onBlur={() => commitIfChanged(key, key)}
        />
      </label>
    );
  }

  return (
    <div className={styles["chat-action-card"]} data-status={draft.status}>
      <div className={styles["chat-action-card__head"]}>
        <div className={styles["chat-action-card__icon"]} aria-hidden="true">
          {isIncome ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />}
        </div>
        <div className={styles["chat-action-card__heading"]}>
          <p className={styles["chat-action-card__title"]}>{dsp?.title || draft.summary}</p>
          <p className={styles["chat-action-card__ref"]}>
            {draft.action === "create" ? "New" : "Update"} ·{" "}
            {isIncome ? "Income" : "Expense"}
            {dsp?.note ? ` · ${dsp.note}` : ""}
          </p>
        </div>
        <span
          className={cx(
            styles["chat-action-card__badge"],
            ready
              ? styles["chat-action-card__badge--ready"]
              : styles["chat-action-card__badge--blocked"],
          )}
        >
          {ready ? "Ready" : "Needs info"}
        </span>
      </div>

      {editable ? (
        <div className={styles["chat-action-card__form"]}>
          <label className={styles["chat-field"]}>
            <span className={styles["chat-field__label"]}>
              {isIncome ? "Name" : "Description"}
            </span>
            <input
              className={styles["chat-field__input"]}
              type="text"
              value={form.name}
              disabled={busy}
              onChange={(e) => setField("name", e.target.value)}
              onBlur={() => commitIfChanged("name", "name")}
            />
          </label>

          <div className={styles["chat-field-row"]}>
            <label className={styles["chat-field"]}>
              <span className={styles["chat-field__label"]}>Amount (PHP)</span>
              <input
                className={styles["chat-field__input"]}
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={form.amount}
                disabled={busy}
                onChange={(e) => setField("amount", e.target.value)}
                onBlur={() => commitIfChanged("amount", "amount")}
              />
            </label>
            <label className={styles["chat-field"]}>
              <span className={styles["chat-field__label"]}>Date</span>
              <input
                className={styles["chat-field__input"]}
                type="date"
                value={form.date}
                disabled={busy}
                onChange={(e) => setField("date", e.target.value)}
                onBlur={() => commitIfChanged("date", "date")}
              />
            </label>
          </div>

          <label className={styles["chat-field"]}>
            <span className={styles["chat-field__label"]}>
              {isCcPayment ? "CC Account" : "Account"}
            </span>
            <select
              className={styles["chat-field__input"]}
              value={form.accountId}
              disabled={busy}
              onChange={(e) => {
                setField("accountId", e.target.value);
                commit("accountId", e.target.value);
              }}
            >
              <option value="">Select account…</option>
              {accountOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          {showTransacted && (
            <label className={styles["chat-field"]}>
              <span className={styles["chat-field__label"]}>
                {isCcPayment ? "Payer Account" : "Transfer Account"}
              </span>
              <select
                className={styles["chat-field__input"]}
                value={form.transactedAccountId}
                disabled={busy}
                onChange={(e) => {
                  setField("transactedAccountId", e.target.value);
                  commit("transactedAccountId", e.target.value);
                }}
              >
                <option value="">Select account…</option>
                {accountOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          )}

          {showCategory && (
            <label className={styles["chat-field"]}>
              <span className={styles["chat-field__label"]}>Category</span>
              <select
                className={styles["chat-field__input"]}
                value={form.categoryId}
                disabled={busy}
                onChange={(e) => {
                  setField("categoryId", e.target.value);
                  commit("categoryId", e.target.value);
                }}
              >
                <option value="">Select category…</option>
                {categoryOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          )}

          {draft.kind === "proposeCreateExpense" && expenseInput("datePaid", "Date Paid", "date")}
          {showCc && (
            <div className={styles["chat-field-row"]}>
              <label className={styles["chat-field"]}>
                <span className={styles["chat-field__label"]}>Payment Status</span>
                <select
                  className={styles["chat-field__input"]}
                  value={form.paymentStatus}
                  aria-required="true"
                  disabled={busy}
                  onChange={(e) => {
                    setField("paymentStatus", e.target.value);
                    commit("paymentStatus", e.target.value);
                  }}
                >
                  <option value="">Select…</option>
                  {paymentStatusLabels.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              {form.paymentStatus === "Installment" && (
                <label className={styles["chat-field"]}>
                  <span className={styles["chat-field__label"]}>Frequency</span>
                  <select
                    className={styles["chat-field__input"]}
                    value={form.paymentFrequency}
                    aria-required="true"
                    disabled={busy}
                    onChange={(e) => {
                      setField("paymentFrequency", e.target.value);
                      commit("paymentFrequency", e.target.value);
                    }}
                  >
                    <option value="">Select…</option>
                    {paymentFrequencyLabels.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          )}

          {showCc && form.paymentStatus === "Installment" && (
            <label className={styles["chat-field"]}>
              <span className={styles["chat-field__label"]}>Period count</span>
              <input
                className={styles["chat-field__input"]}
                type="number"
                inputMode="numeric"
                min="1"
                step="1"
                value={form.periodCount}
                aria-required="true"
                disabled={busy}
                onChange={(e) => setField("periodCount", e.target.value)}
                onBlur={() => commitIfChanged("periodCount", "periodCount")}
              />
            </label>
          )}

          {showCc && (
            <div className={styles["chat-field-row"]}>
              {expenseInput("interest", "Interest", "number", "0.01")}
              {expenseInput("paidPeriod", "Paid Period", "number", "1")}
              {expenseInput("bnplAdjustment", "BNPL adjustment", "number", "1")}
            </div>
          )}

          {showPasabuy && (
            <div className={styles["chat-field-row"]}>
              <label className={styles["chat-field"]}>
                <span className={styles["chat-field__label"]}>Pasabuyer</span>
                <input
                  className={styles["chat-field__input"]}
                  type="text"
                  value={form.pasabuyer}
                  aria-required="true"
                  disabled={busy}
                  onChange={(e) => setField("pasabuyer", e.target.value)}
                  onBlur={() => commitIfChanged("pasabuyer", "pasabuyer")}
                />
              </label>
              <label className={styles["chat-field"]}>
                <span className={styles["chat-field__label"]}>Pasabuy Status</span>
                <select
                  className={styles["chat-field__input"]}
                  value={form.pasabuyStatus}
                  aria-required="true"
                  disabled={busy}
                  onChange={(e) => {
                    setField("pasabuyStatus", e.target.value);
                    commit("pasabuyStatus", e.target.value);
                  }}
                >
                  <option value="">Select…</option>
                  {pasabuyStatusLabels.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {showPasabuy && (
            <>
              <div className={styles["chat-field-row"]}>
                {expenseInput("pasabuyDateOfPayment", "Pasabuy Date of Payment", "date")}
                {expenseInput("pasabuyPaidPeriod", "Pasabuy Paid Period", "number", "1")}
              </div>
              <label className={styles["chat-field"]}>
                <span className={styles["chat-field__label"]}>Pasabuy Account Receiver</span>
                <select
                  className={styles["chat-field__input"]}
                  value={form.pasabuyAccountReceiverId}
                  disabled={busy}
                  onChange={(event) => {
                    setField("pasabuyAccountReceiverId", event.target.value);
                    commit("pasabuyAccountReceiverId", event.target.value);
                  }}
                >
                  <option value="">Select account…</option>
                  {accountOptions.map((option) => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
              </label>
            </>
          )}

          {draft.missingRequired.length > 0 && (
            <p className={styles["chat-action-card__missing"]}>
              Missing: {draft.missingRequired.join(", ")}
            </p>
          )}
          {draft.warnings.length > 0 && (
            <p className={styles["chat-action-card__warn"]}>{draft.warnings.join(" · ")}</p>
          )}
        </div>
      ) : (
        <div className={styles["chat-action-card__body"]}>
          <div className={styles["chat-action-card__amount-row"]}>
            <span className={styles["chat-action-card__label"]}>Amount</span>
            <span className={styles["chat-action-card__amount"]}>
              <span className={styles["chat-action-card__currency"]}>PHP</span>
              {typeof dsp?.amount === "number"
                ? dsp.amount.toLocaleString("en-PH", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                : "—"}
            </span>
          </div>
          {draft.missingRequired.length > 0 && (
            <p className={styles["chat-action-card__missing"]}>
              Missing: {draft.missingRequired.join(", ")}
            </p>
          )}
          {draft.warnings.length > 0 && (
            <p className={styles["chat-action-card__warn"]}>{draft.warnings.join(" · ")}</p>
          )}
        </div>
      )}

      <div className={styles["chat-action-card__foot"]}>
        <button
          type="button"
          className={styles["chat-action-card__approve"]}
          disabled={!ready || busy || needsKey}
          title={needsKey ? "Add an API key to Approve writes" : undefined}
          onClick={() => void onApprove(draft.id)}
        >
          <Check size={15} />
          Approve
        </button>
        <button
          type="button"
          className={styles["chat-action-card__deny"]}
          disabled={busy}
          onClick={() => void onCancel(draft.id)}
        >
          <X size={15} />
          Cancel
        </button>
      </div>
    </div>
  );
}

export { DraftCard };

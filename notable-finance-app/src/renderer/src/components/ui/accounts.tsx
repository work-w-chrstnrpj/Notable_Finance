
import { useState } from "react";
import { ArrowLeft, Banknote, Building2, CreditCard, Download, Landmark, QrCode, Smartphone, X } from "lucide-react";
import { MoneyValue } from "@/components/ui";
import { cx } from "@/lib/finance-helpers";
import { isCreditLikeAccountType } from "@/lib/finance-rules";
import { formatMoney } from "@/lib/format";
import type { Account, AccountType } from "@/types/finance";

function AccountTypeIcon({ type, size = 18 }: { type: AccountType; size?: number }) {
  switch (type) {
    case "Cash":
      return <Banknote size={size} />;
    case "Credit Account":
    case "e-Credit":
    case "BNPL":
      return <CreditCard size={size} />;
    case "Savings":
      return <Landmark size={size} />;
    case "e-Wallet":
    case "Digital Bank":
      return <Smartphone size={size} />;
    default:
      return <Building2 size={size} />;
  }
}

function isImageUrl(value: string): boolean {
  return /^(https?:\/\/|data:|\/)/.test(value);
}

function AccountIcon({ account }: { account: Account }) {
  if (account.icon && isImageUrl(account.icon)) {
    return (
      <img
        src={account.icon}
        alt=""
        width={24}
        height={24}
        className="account-icon"
        onError={(event) => {
          const target = event.currentTarget;
          target.style.display = "none";
          const fallback = target.nextElementSibling;
          if (fallback) {
            (fallback as HTMLElement).style.display = "grid";
          }
        }}
      />
    );
  }

  if (account.icon) {
    return (
      <span className="account-icon account-icon--emoji" aria-hidden="true">
        {account.icon}
      </span>
    );
  }

  return (
    <span className="account-icon account-icon--fallback">
      <AccountTypeIcon type={account.type} size={18} />
    </span>
  );
}

function AccountDetailModal({
  account,
  onClose,
}: {
  account: Account;
  onClose: () => void;
}) {
  const isCredit = isCreditLikeAccountType(account.type);
  const [showQr, setShowQr] = useState(false);

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        aria-labelledby="account-modal-title"
        aria-modal="true"
        className="modal-panel modal-panel--account"
        role="dialog"
      >
        <div className="modal-panel__header">
          <div className="account-modal__title-row">
            {account.icon && isImageUrl(account.icon) ? (
              <img src={account.icon} alt="" width={40} height={40} className="account-icon account-icon--large" />
            ) : account.icon ? (
              <span className="account-icon account-icon--emoji account-icon--large" aria-hidden="true">
                {account.icon}
              </span>
            ) : (
              <span className="account-icon account-icon--fallback account-icon--large">
                <AccountTypeIcon type={account.type} size={22} />
              </span>
            )}
            <div>
              <h2 id="account-modal-title">{account.name}</h2>
              <p>{account.information}</p>
            </div>
          </div>
          <div className="account-modal__header-actions">
            {showQr && account.qrCode && (
              <a
                href={account.qrCode}
                download={`${account.name.replace(/\s+/g, '-').toLowerCase()}-qr.png`}
                className="icon-button"
                aria-label="Download QR code"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download size={17} />
              </a>
            )}
            {account.qrCode && (
              <button
                type="button"
                className="icon-button"
                aria-label={showQr ? "Show account details" : "Show QR code"}
                onClick={() => setShowQr((prev) => !prev)}
              >
                {showQr ? <ArrowLeft size={17} /> : <QrCode size={17} />}
              </button>
            )}
            <button type="button" className="icon-button" aria-label="Close modal" onClick={onClose}>
              <X size={17} />
            </button>
          </div>
        </div>
        {showQr && account.qrCode ? (
          <div className="account-qr">
            <img src={account.qrCode} alt={`${account.name} QR code`} />
          </div>
        ) : (
          <div className="modal-panel__body">
            <div className="account-detail-grid">
              <div className="account-detail-section">
              <h3 className="account-detail-section__title">Account Info</h3>
              <div className="account-detail-fields">
                <div className="account-detail-field">
                  <span>Type</span>
                  <strong>{account.type}</strong>
                </div>
                <div className="account-detail-field">
                  <span>Status</span>
                  <strong>{account.inactive ? "Inactive" : "Active"}</strong>
                </div>

              </div>
            </div>

            <div className="account-detail-section">
              <h3 className="account-detail-section__title">Balances</h3>
              <div className="account-detail-fields">
                <div className="account-detail-field">
                  <span>Starting Balance</span>
                  <MoneyValue value={account.startingBalance} />
                </div>
                <div className="account-detail-field">
                  <span>Current Balance</span>
                  <MoneyValue value={account.currentBalance} />
                </div>
                <div className="account-detail-field">
                  <span>{isCredit ? "Total Payment Made" : "Total Cash Inflow"}</span>
                  {account.totalIncomes !== null ? (
                    <MoneyValue value={account.totalIncomes} />
                  ) : (
                    <span className="money-value">—</span>
                  )}
                </div>
                <div className="account-detail-field">
                  <span>{isCredit ? "Total Purchase Expenses" : "Total Cash Outflow"}</span>
                  {account.totalExpenses !== null ? (
                    <MoneyValue value={account.totalExpenses} />
                  ) : (
                    <span className="money-value">—</span>
                  )}
                </div>
                <div className="account-detail-field">
                  <span>Total Pasabuy</span>
                  {account.totalPasabuy !== null ? (
                    <MoneyValue value={account.totalPasabuy} />
                  ) : (
                    <span className="money-value">—</span>
                  )}
                </div>
                <div className="account-detail-field">
                  <span>Total CC, Debt & Transfer</span>
                  {account.totalCcDebtTransfer !== null ? (
                    <MoneyValue value={account.totalCcDebtTransfer} />
                  ) : (
                    <span className="money-value">—</span>
                  )}
                </div>
              </div>
            </div>

            {isCredit && (
              <div className="account-detail-section">
                <h3 className="account-detail-section__title">Credit Details</h3>
                <div className="account-detail-fields">
                  {account.creditLimit !== null && (
                    <div className="account-detail-field">
                      <span>Credit Limit</span>
                      <MoneyValue value={account.creditLimit} />
                    </div>
                  )}
                  {account.availableLimit !== null && (
                    <div className="account-detail-field">
                      <span>Available Limit</span>
                      <MoneyValue value={account.availableLimit} />
                    </div>
                  )}
                  {account.creditPoints !== null && (
                    <div className="account-detail-field">
                      <span>Credit Points</span>
                      <strong>{account.creditPoints.toLocaleString()}</strong>
                    </div>
                  )}
                  {account.annualFee !== null && (
                    <div className="account-detail-field">
                      <span>Annual Fee</span>
                      <MoneyValue value={account.annualFee} />
                    </div>
                  )}
                  {account.billingDay !== null && (
                    <div className="account-detail-field">
                      <span>Billing Day</span>
                      <strong>Day {account.billingDay}</strong>
                    </div>
                  )}
                  {account.dueDay !== null && (
                    <div className="account-detail-field">
                      <span>Due Day</span>
                      <strong>Day {account.dueDay}</strong>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        )}
      </section>
    </div>
  );
}

export { AccountTypeIcon, isImageUrl, AccountIcon, AccountDetailModal };

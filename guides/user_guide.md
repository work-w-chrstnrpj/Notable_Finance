# Notable Finance — User Guide

> A personal finance UI where **Notion remains the source of truth**. The app provides encoding, viewing, validation, and synchronization over your Notion financial workspace.

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Prerequisites](#2-prerequisites)
3. [Installation & Setup](#3-installation--setup)
4. [Authentication](#4-authentication)
5. [Notion Configuration](#5-notion-configuration)
6. [Dashboard](#6-dashboard)
7. [Accounts](#7-accounts)
8. [Income](#8-income)
9. [Expense](#9-expense)
10. [Monthly Monitoring](#10-monthly-monitoring)
11. [Transfer](#11-transfer)
12. [Credit Card Payment](#12-credit-card-payment)
13. [Alkansya](#13-alkansya)
14. [Receivables](#14-receivables)
15. [Sync Center](#15-sync-center)
16. [Settings](#16-settings)
17. [Floating Action Button (FAB)](#17-floating-action-button-fab)
18. [Troubleshooting](#18-troubleshooting)
19. [Architecture Notes](#19-architecture-notes)

---

## 1. Introduction

**Notable Finance** is a personal finance application that turns your Notion workspace into a clean, purpose-built UI for everyday financial management. Notion remains the canonical store for all your financial records — the app is an encoding, viewing, validation, and synchronization layer on top of it.

### What you can do

- **View** your finances across Dashboard, Accounts, Income, Expense, Monthly Monitoring, Transfer, Credit Card Payment, Alkansya, and Receivables.
- **Create, edit, and delete** income, expense, and transaction records through clean forms — no Notion formula or rollup fields exposed.
- **Synchronize** your app changes to Notion and pull the latest Notion data back into the app.
- **Track** spending trends, cash flow, net income, and monthly monitoring at a glance.

### What the app does NOT do

- Expose computed Notion fields (formulas, rollups, reverse relations) in user forms.
- Allow creating, editing, or deleting Accounts, Income Categories, or Expense Categories — those stay maintained in Notion and are read-only in the app.
- Call Notion directly from the frontend — all Notion communication goes through the backend.

---

## 2. Prerequisites

Before you begin, make sure you have:

| Requirement | Details |
|---|---|
| **Node.js** | v18 or later (LTS recommended) |
| **npm** | v9 or later (comes with Node.js) |
| **PostgreSQL** | A PostgreSQL database — [Neon Free](https://neon.tech) is the planned provider |
| **Notion account** | An existing Notion workspace with financial data |
| **Notion Integration** | A Notion internal integration with an API key and access to your finance databases |
| **Git** | For cloning the repository |

---

## 3. Installation & Setup

### 3.1 Clone the repository

```bash
git clone <repository-url>
cd "Notable Finance"
```

### 3.2 Backend setup (`notable-finance-web/service/`)

The web app lives under `notable-finance-web/`. From the repository root:

```bash
cd notable-finance-web/service
npm install
```

Create a `.env` file in `notable-finance-web/service/` with the required environment variables:

```env
# Server
PORT=3001
CORS_ORIGIN=http://localhost:3000

# Database (PostgreSQL — Neon Free recommended)
DATABASE_URL=postgresql://user:password@host:5432/notable_finance

# Authentication
JWT_SECRET=your-64-character-hex-string
JWT_EXPIRES_IN=7d

# Notion Encryption
ENCRYPTION_KEY=64-char-hex-string-for-AES-256-GCM

# Notion (dev fallback — never use in production)
NOTION_TOKEN=ntn_xxxxxxxxxxxxxxxxxxxxxx

# Notion Database IDs
NOTION_ACCOUNTS_DB_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NOTION_CATEGORIES_DB_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NOTION_INCOMES_DB_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NOTION_EXPENSES_DB_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NOTION_TRANSACTIONS_DB_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NOTION_SCHEDULER_DB_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NOTION_MONTHLY_MONITORING_DB_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Google OAuth (for Google Sign-In)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Cache
LIVE_CACHE_TTL_MS=60000
```

Run the backend:

```bash
npm run start:dev
```

The backend starts on `http://localhost:3001` by default.

### 3.3 Frontend setup (`notable-finance-web/application/`)

From the repository root:

```bash
cd notable-finance-web/application
npm install
```

Create a `.env.local` file in `notable-finance-web/application/`:

```env
NEXT_PUBLIC_BACKEND_API_BASE_PATH=http://localhost:3001/api/v1
```

Run the frontend:

```bash
npm run dev
```

The frontend starts on `http://localhost:3000` by default.

### 3.4 Verify the setup

| Check | Command / Action |
|---|---|
| Backend health | Visit `http://localhost:3001` or check terminal output |
| Frontend loads | Open `http://localhost:3000` in your browser |
| Database connected | Backend logs show successful PostgreSQL connection |

---

## 4. Authentication

Notable Finance supports two sign-in methods:

### 4.1 Email + Password

1. Navigate to **/register** to create a new account with your email and password.
2. Navigate to **/login** to sign in with your registered email and password.

### 4.2 Google Sign-In

1. On the login page, click **Sign in with Google**.
2. Complete the Google OAuth flow in the popup.
3. You will be redirected back to the app.

### 4.3 Session management

- Your session is stored as a JWT token in `localStorage` under the key `nf_token`.
- If your token expires or becomes invalid, the app will redirect you to `/login?session=expired` and clear the token automatically.
- Use the **Sign Out** button in Settings to end your session manually.

---

## 5. Notion Configuration

After signing in, you must connect your Notion workspace before the app can display or sync data.

### 5.1 Setting up a Notion Integration

1. Go to [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations).
2. Click **New integration** and give it a name (e.g., "Notable Finance").
3. Select the workspace that contains your finance databases.
4. Copy the **Internal Integration Secret** (the `ntn_...` token).
5. In your Notion workspace, open each finance database and click **...** > **Connections** > add your new integration.

### 5.2 Configuring the app

1. Open **Settings** from the sidebar.
2. Under **Notion Configuration**, paste your Notion Integration Token.
3. Enter the Database IDs for each finance database. You can find a database ID in the URL of any Notion database page — it is the 32-character hex string after the database name.
4. Click **Save** to store your configuration (encrypted in the database).

### 5.3 Verifying the schema

After entering your Notion configuration:

1. Go to **Settings** > **Schema**.
2. Click **Verify Schema**.
3. The app will check that each configured database has the expected properties and structure.
4. If any mismatches are found, review your Notion database properties against the expected schema.

---

## 6. Dashboard

The **Dashboard** is your home screen. It provides a high-level overview of your financial picture:

| Widget | Description |
|---|---|
| **Cash Flow** | Income vs. expenses for the current period |
| **Net Income** | Income minus expenses |
| **Expense Breakdown** | Spending by category |
| **Spending Trends** | Trend lines showing spending over time |
| **Monthly Summary** | Quick look at the current month |

Use the Dashboard as your starting point each time you open the app. It pulls the latest data from Notion to keep everything current.

---

## 7. Accounts

The **Accounts** section shows all your active financial accounts in Notion.

### Viewing accounts

- **Gallery/Card view** — visual cards for each account with key details.
- **Table view** — a tabular list of all active accounts.

### Important notes

- Accounts are **read-only** in the app. You cannot create, edit, or delete accounts from the app.
- Only **active** accounts are shown by default.
- To create, edit, or deactivate an account, make the change directly in your Notion workspace.

### Account types

| Type | Description |
|---|---|
| Cash | Physical cash |
| Savings | Savings accounts |
| e-Wallet | GCash, Maya, etc. |
| Digital Bank | Tonik, Maya Bank, etc. |
| Credit Account | Credit cards |
| e-Credit | Electronic credit lines |
| BNPL | Buy Now Pay Later accounts |
| Auxiliary | Auxiliary workflow accounts |

---

## 8. Income

The **Income** section lets you view, create, edit, and soft-delete income records.

### View modes

| Mode | Scope | Month Selector |
|---|---|---|
| **Daily** | Current day only | Not shown |
| **Weekly** | Current week | Not shown |
| **Monthly** | Selected month | Shown |
| **Annually** | Current year | Not shown |

Switch between modes using the view toggle at the top of the Income page.

### Creating an income record

1. Click the **+ Add New Income** button (or use the FAB if enabled).
2. Fill in the required fields:
   - **Title** — a description of the income (auto-tagged with `[YYMMDD]`).
   - **Amount** — the income amount.
   - **Category** — select from your income categories (normal categories only — auxiliary categories like `IOU`, `Transfer`, `Old Income Logger`, `Credit Card Payment`, and `Debt Payment` are excluded from normal forms).
   - **Date** — the date of the income.
   - **Account** — the account where the income was received (if applicable).
3. Click **Save**.

> **Note:** Normal Income forms do not expose transaction-only fields such as `Transacted Account` or `CC Payment Covered`.

### Editing an income record

1. Open an income record from the list.
2. Modify the fields you need to change.
3. Click **Save**.

### Deleting an income record

- Income records are **soft-deleted**. When you delete an income record:
  - The title is rewritten to include `[Deleted: <Amount>]`.
  - The amount is cleared.
  - The record remains in Notion for audit purposes but is no longer active.

### Quick-add tags

Income titles are automatically tagged with `[YYMMDD]` (e.g., `[260713]`) based on the record date.

---

## 9. Expense

The **Expense** section handles day-to-day expense tracking with several specialized view modes.

### View modes

| Mode | Description |
|---|---|
| **Daily** | Expenses for the current day |
| **Weekly** | Expenses for the current week |
| **Monthly** | Expenses for the selected month |
| **Unpaid Pasabuy** | Records with outstanding Pasabuy status |
| **To pay** | Outstanding pay workflow records |
| **To buy** | Outstanding buy workflow records |
| **Installments** | Records with installment payment status |
| **CC Transactions** | Credit card transaction records |

### Creating an expense record

1. Click the **+ Add New Expense** button (or use the FAB if enabled).
2. Fill in the required fields:
   - **Description** — what the expense is for (auto-tagged with `[YYMMDDx]`).
   - **Amount** — the expense amount.
   - **Category** — select from your expense categories.
   - **Account** — the account used for payment.
   - **Date** — the date of the expense.
3. Additional fields appear based on the selected **Account** and **Category**:

| Condition | Additional fields |
|---|---|
| Account is **Credit Account** or **BYPL** | Credit card-specific fields (card used, billing cycle, etc.) |
| Category is **Pasabuy** | Pasabuy workflow fields (who bought, who owes, status, etc.) |

4. Click **Save**.

### Editing an expense record

1. Open an expense record from the list.
2. Modify the fields you need to change.
3. Click **Save**.

### Deleting an expense record

- Like Income, expenses are **soft-deleted**:
  - Title is rewritten to include `[Deleted: <Amount>]`.
  - Amount is cleared.
  - Record remains in Notion.

### Quick-add tags

Expense descriptions are automatically tagged with `[YYMMDDx]` where `x` is an incrementing suffix for same-day expenses.

---

## 10. Monthly Monitoring

**Monthly Monitoring** provides a read-only, month-level summary of your financial health.

### What it shows

| Metric | Description |
|---|---|
| **Income Total** | Total income for the month |
| **Expense Total** | Total expenses for the month |
| **Gross Margin** | Income minus expenses |
| **Needs** | Essential spending breakdown |
| **Wants** | Discretionary spending breakdown |
| **Savings** | Savings portion breakdown |

### How to use it

1. Navigate to **Monthly Monitoring** in the sidebar.
2. Use the month selector to browse different months.
3. Review the metrics to understand your monthly financial picture.

> **Note:** Monthly Monitoring data is computed in Notion and is **read-only** in the app. To influence these numbers, adjust your income and expense records.

---

## 11. Transfer

**Transfer** lets you move money between non-credit accounts.

### How it works

1. Navigate to **Transfer** in the sidebar.
2. Click to create a new transfer.
3. Select the **source account** (where money is coming from).
4. Select the **destination account** (where money is going).
5. Enter the **amount**.
6. The **category** is automatically set to **"Transfer"** — you do not need to choose it.
7. Click **Save**.

> **Note:** Transfers create paired records: a deduction from the source account and a credit to the destination account.

---

## 12. Credit Card Payment

**Credit Card Payment** lets you pay off credit card balances from a non-credit account.

### How it works

1. Navigate to **Credit Card Payment** in the sidebar.
2. Click to create a new payment.
3. Select the **credit card account** (the card being paid off).
4. Select the **source account** (the non-credit account paying).
5. Enter the **amount**.
6. The **category** is automatically set to **"Credit Card Payment"**.
7. Click **Save**.

> **Note:** This workflow handles the bookkeeping side of paying off a credit card. The actual payment to your credit card issuer happens outside the app.

---

## 13. Alkansya

**Alkansya** tracks your savings contributions.

### How it works

1. Navigate to **Alkansya** in the sidebar.
2. Click to add a new savings entry.
3. Enter the **amount** (shown as negative, representing money set aside).
4. The **category** is automatically set to **"Savings"**.
5. Click **Save**.

> **Note:** Alkansya entries represent money being set aside. Amounts are displayed as negatives to reflect that they are earmarked savings, not available cash flow.

---

## 14. Receivables

**Receivables** tracks income that has been earned but not yet received into an account.

### How it works

1. Navigate to **Receivables** in the sidebar.
2. View outstanding receivables — income records waiting to be received.
3. When you receive the money, select the **account** where it was deposited.
4. Once an account is selected, the record **transitions to Income** and appears in the Income section.

> **Note:** Receivables is a staging area. Records live here until they are assigned to an account, at which point they become regular income records.

---

## 15. Sync Center

**Sync Center** manages the flow of data between the app and your Notion workspace.

### The sync cycle

```
Pull from Notion → Write app changes to Notion → Pull latest Notion data → Refresh UI
```

| Step | What happens |
|---|---|
| **1. Pull from Notion** | The app fetches the latest data from all your Notion databases. |
| **2. Write to Notion** | Any app-created, edited, or deleted records are pushed to Notion. |
| **3. Pull again** | The app re-fetches data from Notion to capture any external changes and confirm writes succeeded. |
| **4. Refresh UI** | The app updates its local state with the latest Notion data. |

### How to use Sync Center

1. Navigate to **Sync Center** in the sidebar.
2. Click **Sync** to start the full sync cycle.
3. Wait for the progress indicator to complete.
4. The UI refreshes with the latest data.

### Schema Verification

You can also verify your Notion database schema from Sync Center or Settings to ensure the connected databases have the expected properties.

---

## 16. Settings

Settings is accessible from the sidebar. It has several sections:

### Interface

| Setting | Description |
|---|---|
| **FAB Toggle** | Show or hide the Floating Action Button |

### Theme

| Setting | Options |
|---|---|
| **Theme** | Light, Dark, or System (follows your OS preference) |
| **Accent Color** | Choose your preferred accent color |

### Account

| Setting | Description |
|---|---|
| **Name** | Your display name |
| **Email** | Your registered email |
| **Change Email** | Update your email address |
| **Change Password** | Update your password |
| **Sign Out** | End your current session |

### Schema

| Action | Description |
|---|---|
| **Verify Schema** | Checks that your Notion databases match the expected structure |

### Notion Configuration

| Setting | Description |
|---|---|
| **Notion Token** | Your Notion internal integration secret (encrypted in the database) |
| **Database IDs** | IDs for each finance database (Accounts, Categories, Incomes, Expenses, Transactions, Scheduler, Monthly Monitoring) |

> **Security:** Your Notion token and database IDs are encrypted using AES-256-GCM before storage. Never share your token publicly.

### Danger Zone

| Action | Description |
|---|---|
| **Delete Account** | Permanently deletes your app account. This is irreversible. |

---

## 17. Floating Action Button (FAB)

The **Floating Action Button** is a quick-action shortcut available throughout the app. It can be toggled on or off in **Settings** > **Interface**.

### Available actions by section

| Section | FAB Action |
|---|---|
| Income | **Add New Income** |
| Expense | **Add New Expense**, **Print Receipt** |
| Monthly Monitoring | **Monthly Insight Shot** |
| Other sections | Context-appropriate quick actions |

Click the FAB to see available options, then select the action you need.

---

## 18. Troubleshooting

### Common issues

#### "Session expired" redirect

**Cause:** Your JWT token expired or became invalid.

**Fix:**
1. You will be redirected to `/login?session=expired`.
2. Sign in again with your email/password or Google account.

---

#### No data showing in the app

**Cause:** Notion is not configured or the databases are not connected.

**Fix:**
1. Go to **Settings** > **Notion Configuration**.
2. Verify your Notion token is entered correctly.
3. Verify all Database IDs are correct.
4. Click **Verify Schema** in Settings or Sync Center.
5. Click **Sync** in Sync Center to pull data.

---

#### Schema verification fails

**Cause:** Your Notion database properties do not match the expected schema.

**Fix:**
1. Open the failing database in Notion.
2. Check that all required properties exist with the correct types.
3. Compare against the project's expected schema in the wiki or documentation.
4. Re-run **Verify Schema** after making corrections.

---

#### Sync fails midway

**Cause:** Network interruption, Notion API rate limit, or invalid data.

**Fix:**
1. Check your internet connection.
2. Wait a moment for any rate limits to reset.
3. Try syncing again.
4. If the issue persists, check the backend logs for error details.

---

#### Cannot create income or expense

**Cause:** Missing required fields or no categories/accounts available.

**Fix:**
1. Ensure you have at least one income category and one expense category set up in Notion.
2. Ensure you have at least one active account in Notion.
3. Verify the Notion integration has access to the relevant databases.

---

#### Credit card fields not appearing

**Cause:** The selected account is not a Credit Account or BYPL type.

**Fix:**
1. Credit card fields only appear when the account type is **Credit Account** or **BYPL**.
2. Select the correct account type when creating the expense.

---

#### Pasabuy fields not appearing

**Cause:** The selected category is not a Pasabuy category.

**Fix:**
1. Pasabuy fields only appear for **Pasabuy** workflow categories.
2. Select the correct category when creating the expense.

---

## 19. Architecture Notes

This section is for developers and advanced users who want to understand how the app works under the hood.

### High-level architecture

```
┌─────────────────────────────────────────┐
│            Frontend (Next.js)            │
│   application/ — React UI, routing,     │
│   state, forms, FAB, theme              │
└──────────────────┬──────────────────────┘
                   │ HTTP API calls
                   ▼
┌─────────────────────────────────────────┐
│           Backend (NestJS)               │
│   service/ — API, validation, auth,     │
│   sync, Notion adapter, encryption      │
└──────────────────┬──────────────────────┘
                   │ Notion API
                   ▼
┌─────────────────────────────────────────┐
│          Notion Workspace                │
│   Canonical data store for all          │
│   finance records                       │
└─────────────────────────────────────────┘
```

### Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js, React, TypeScript |
| Backend | NestJS, TypeScript |
| Database | PostgreSQL (Neon Free) — app metadata, sync logs, sessions, conflicts, audit |
| Auth | JWT (email/password + Google OAuth) |
| Canonical Store | Notion API |
| Encryption | AES-256-GCM for stored secrets |
| Testing | Vitest, React Testing Library, Jest, Supertest, Playwright |

### Deployment targets

| Component | Target |
|---|---|
| Frontend | Vercel |
| Backend | Render |
| PostgreSQL | Neon Free |

### Key design principles

1. **Notion is source of truth.** The app never overrides Notion as the canonical store.
2. **Frontend never calls Notion.** All Notion communication is routed through the backend.
3. **Computed fields are hidden.** Formulas, rollups, and reverse relations are not exposed in user forms.
4. **Write-through sync.** Changes go through the backend to Notion; the app then re-pulls to stay consistent.
5. **Soft deletes.** Income and expense records are soft-deleted by rewriting titles and clearing amounts.
6. **Accounts are read-only in app.** Account management stays in Notion.
7. **Secrets stay server-side.** Notion tokens and encryption keys are never exposed in frontend code.

### Environment variables reference

#### Backend (`service/`)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | Backend server port |
| `CORS_ORIGIN` | — | Allowed CORS origin (typically the frontend URL) |
| `DATABASE_URL` | — | PostgreSQL connection string |
| `JWT_SECRET` | — | Secret for signing JWTs |
| `JWT_EXPIRES_IN` | `7d` | JWT token lifetime |
| `ENCRYPTION_KEY` | — | 64-character hex string for AES-256-GCM encryption |
| `NOTION_TOKEN` | — | Notion integration secret (dev fallback) |
| `NOTION_*_DB_ID` | — | Database IDs for each finance database |
| `GOOGLE_CLIENT_ID` | — | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | — | Google OAuth client secret |
| `LIVE_CACHE_TTL_MS` | `60000` | Cache time-to-live in milliseconds |

#### Frontend (`application/`)

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_BACKEND_API_BASE_PATH` | `/api/v1` | Base path for backend API calls |

---

*This guide covers the Notable Finance application as of its current development stage. Features and UI may evolve as the project progresses. Refer to the project wiki for the latest product specification and technical design.*

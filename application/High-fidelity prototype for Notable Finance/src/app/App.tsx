import { useState } from "react";
import {
  LayoutDashboard, CreditCard, TrendingUp, Receipt, CalendarDays,
  RefreshCw, Palette, LogOut, Plus, Search, X, CheckCircle,
  AlertCircle, Clock, ArrowUpRight, ArrowDownRight, Trash2, Edit2,
  Database, Save, Moon, Sun, Monitor, Wallet, Activity,
  AlertTriangle, ChevronLeft, ChevronRight, ArrowRight, Star,
  CheckCheck, Eye, EyeOff, Copy, TrendingDown, Banknote, PiggyBank,
  Target, Check, Shield, Zap
} from "lucide-react";
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

type Screen = "landing" | "auth" | "app";
type AuthView = "signin" | "signup";
type Page = "dashboard" | "accounts" | "income" | "expenses" | "monthly" | "sync" | "notion" | "appearance";
type SyncState = "idle" | "syncing" | "success" | "error" | "conflict";
type ColorMode = "light" | "dark" | "system";

interface Account {
  id: string; name: string;
  type: "checking" | "savings" | "credit" | "e-wallet";
  creditLimit: number | null; billingDay: number | null; dueDay: number | null;
  balance: number; available: number | null;
}
interface IncomeRecord {
  id: string; name: string; date: string; grossIncome: number; capex: number;
  account: string; category: string; transactionAccount: string; netIncome: number; transactionAmount: number;
}
interface IncomeCategory {
  id: string; source: string; monthlyEarnings: number; monthlyExpenditure: number;
  monthlyGross: number; earningPercentage: number;
}
interface ExpenseRecord {
  id: string; purchaseDate: string; datePaid: string | null; amount: number; interest: number;
  account: string; category: string; status: "paid" | "unpaid" | "partial" | "installment" | "overdue";
  frequency: "one-time" | "monthly" | "installment" | "recurring";
  periodCount: number | null; paidPeriod: number | null;
  pasabuyer: string | null; installmentAmount: number | null; paidAmount: number; description: string;
}
interface ExpenseCategory {
  id: string; name: string; monthlyBudget: number; expenses: number; spending: number;
}
interface SyncLogEntry {
  id: string; type: "created" | "updated" | "deleted" | "pulled" | "conflict" | "error";
  entity: string; description: string; timestamp: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCENT_PRESETS = [
  { name: "Indigo",  color: "#5B6CF9" }, { name: "Violet", color: "#7C3AED" },
  { name: "Teal",   color: "#0D9488" }, { name: "Emerald", color: "#059669" },
  { name: "Amber",  color: "#D97706" }, { name: "Rose",   color: "#E11D48" },
  { name: "Sky",    color: "#0284C7" }, { name: "Coral",  color: "#EA580C" },
];

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const NAV_ITEMS: { id: Page; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard",           icon: LayoutDashboard },
  { id: "accounts",  label: "Accounts",            icon: CreditCard },
  { id: "income",    label: "Income",              icon: TrendingUp },
  { id: "expenses",  label: "Expenses",            icon: Receipt },
  { id: "monthly",   label: "Monthly Monitoring",  icon: CalendarDays },
  { id: "sync",      label: "Sync Center",         icon: RefreshCw },
];

const SETTINGS_ITEMS: { id: Page; label: string; icon: React.ElementType }[] = [
  { id: "notion",     label: "Notion Settings", icon: Database },
  { id: "appearance", label: "Appearance",      icon: Palette },
];

const PAGE_TITLES: Record<Page, string> = {
  dashboard: "Dashboard", accounts: "Accounts", income: "Income", expenses: "Expenses",
  monthly: "Monthly Monitoring", sync: "Sync Center", notion: "Notion Settings", appearance: "Appearance",
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

const mockAccounts: Account[] = [
  { id:"1", name:"BDO Checking Account",  type:"checking", creditLimit:null,   billingDay:null, dueDay:null, balance:45230.50,  available:null },
  { id:"2", name:"BPI Family Savings",    type:"savings",  creditLimit:null,   billingDay:null, dueDay:null, balance:123450.00, available:null },
  { id:"3", name:"Metrobank Credit Card", type:"credit",   creditLimit:150000, billingDay:15,   dueDay:10,   balance:-45800.00, available:104200 },
  { id:"4", name:"BPI Amore Platinum",    type:"credit",   creditLimit:200000, billingDay:20,   dueDay:15,   balance:-87500.00, available:112500 },
  { id:"5", name:"GCash Wallet",          type:"e-wallet", creditLimit:null,   billingDay:null, dueDay:null, balance:8750.25,   available:null },
  { id:"6", name:"Maya Savings",          type:"savings",  creditLimit:null,   billingDay:null, dueDay:null, balance:32100.00,  available:null },
];

const mockIncomeRecords: IncomeRecord[] = [
  { id:"1", name:"July Salary — Accenture PH",  date:"2025-07-15", grossIncome:85000, capex:5000, account:"BDO Checking Account", category:"Employment", transactionAccount:"BDO Checking Account", netIncome:72500, transactionAmount:72500 },
  { id:"2", name:"Freelance Project — Globe API", date:"2025-07-05", grossIncome:25000, capex:2500, account:"BPI Family Savings", category:"Freelance", transactionAccount:"GCash Wallet", netIncome:20000, transactionAmount:20000 },
  { id:"3", name:"June Salary — Accenture PH",  date:"2025-06-15", grossIncome:85000, capex:5000, account:"BDO Checking Account", category:"Employment", transactionAccount:"BDO Checking Account", netIncome:72500, transactionAmount:72500 },
];

const mockIncomeCategories: IncomeCategory[] = [
  { id:"1", source:"Employment", monthlyEarnings:85000, monthlyExpenditure:5000, monthlyGross:80000, earningPercentage:77.4 },
  { id:"2", source:"Freelance",  monthlyEarnings:25000, monthlyExpenditure:2500, monthlyGross:22500, earningPercentage:21.7 },
  { id:"3", source:"Dividends",  monthlyEarnings:900,   monthlyExpenditure:0,    monthlyGross:900,   earningPercentage:0.9 },
];

const mockExpenseRecords: ExpenseRecord[] = [
  { id:"1", purchaseDate:"2025-07-01", datePaid:"2025-07-01", amount:12500,    interest:0,    account:"BDO Checking Account", category:"Housing",     status:"paid",        frequency:"monthly",     periodCount:null, paidPeriod:null, pasabuyer:null,      installmentAmount:null,    paidAmount:12500, description:"Monthly Rent — Pasig Studio" },
  { id:"2", purchaseDate:"2025-07-03", datePaid:null,          amount:3500,     interest:0,    account:"GCash Wallet",          category:"Food & Dining",status:"unpaid",      frequency:"one-time",    periodCount:null, paidPeriod:null, pasabuyer:null,      installmentAmount:null,    paidAmount:0,     description:"Groceries — S&R Membership Shopping" },
  { id:"3", purchaseDate:"2025-06-20", datePaid:"2025-07-10", amount:45000,    interest:1200, account:"Metrobank Credit Card", category:"Gadgets",     status:"installment", frequency:"installment", periodCount:12,   paidPeriod:3,    pasabuyer:null,      installmentAmount:3866.67, paidAmount:11600, description:"iPhone 15 Pro — Apple Store PH" },
  { id:"4", purchaseDate:"2025-07-05", datePaid:null,          amount:8000,     interest:0,    account:"BPI Amore Platinum",    category:"Shopping",    status:"unpaid",      frequency:"one-time",    periodCount:null, paidPeriod:null, pasabuyer:"Ate Mara",installmentAmount:null,    paidAmount:0,     description:"Amazon Purchase — Pasabuy" },
  { id:"5", purchaseDate:"2025-07-02", datePaid:"2025-07-02", amount:2200,     interest:0,    account:"GCash Wallet",          category:"Transportation",status:"paid",       frequency:"monthly",     periodCount:null, paidPeriod:null, pasabuyer:null,      installmentAmount:null,    paidAmount:2200,  description:"Grab Monthly Commuter Load" },
  { id:"6", purchaseDate:"2025-06-15", datePaid:null,          amount:1800,     interest:350,  account:"Metrobank Credit Card", category:"Utilities",   status:"overdue",     frequency:"monthly",     periodCount:null, paidPeriod:null, pasabuyer:null,      installmentAmount:null,    paidAmount:0,     description:"Meralco Electricity Bill — June" },
];

const mockExpenseCategories: ExpenseCategory[] = [
  { id:"1", name:"Housing",        monthlyBudget:15000, expenses:12500, spending:12500 },
  { id:"2", name:"Food & Dining",  monthlyBudget:8000,  expenses:5200,  spending:5200 },
  { id:"3", name:"Transportation", monthlyBudget:3000,  expenses:2200,  spending:2200 },
  { id:"4", name:"Gadgets",        monthlyBudget:5000,  expenses:3866,  spending:3866 },
  { id:"5", name:"Shopping",       monthlyBudget:6000,  expenses:3500,  spending:3500 },
  { id:"6", name:"Utilities",      monthlyBudget:3500,  expenses:1800,  spending:1800 },
  { id:"7", name:"Entertainment",  monthlyBudget:2000,  expenses:850,   spending:850 },
  { id:"8", name:"Health",         monthlyBudget:2500,  expenses:1200,  spending:1200 },
];

const mockSyncLog: SyncLogEntry[] = [
  { id:"1", type:"pulled",   entity:"All Databases",     description:"Pulled latest changes from all 6 Notion databases",    timestamp:"2025-07-15 14:32:10" },
  { id:"2", type:"created",  entity:"Income Record",     description:"Created: July Salary — Accenture PH",                  timestamp:"2025-07-15 14:31:05" },
  { id:"3", type:"updated",  entity:"Account",           description:"Updated: BDO Checking Account balance",                timestamp:"2025-07-15 14:30:22" },
  { id:"4", type:"conflict", entity:"Expense Record",    description:"Conflict detected in: Amazon Purchase — Pasabuy",      timestamp:"2025-07-14 10:15:00" },
  { id:"5", type:"deleted",  entity:"Income Category",   description:"Deleted: Old side hustle category",                    timestamp:"2025-07-13 09:00:00" },
  { id:"6", type:"error",    entity:"Monthly Monitoring",description:"Failed to sync: network timeout on database read",      timestamp:"2025-07-12 18:45:30" },
];

const chartData = [
  { month:"Feb", income:82000,  expenses:38500 },
  { month:"Mar", income:85000,  expenses:41200 },
  { month:"Apr", income:85000,  expenses:43800 },
  { month:"May", income:110000, expenses:47200 },
  { month:"Jun", income:85000,  expenses:39600 },
  { month:"Jul", income:103400, expenses:31216 },
];

const categoryPieData = [
  { name:"Housing",      value:12500, color:"#5B6CF9" },
  { name:"Food",         value:5200,  color:"#0D9488" },
  { name:"Transport",    value:2200,  color:"#D97706" },
  { name:"Gadgets",      value:3866,  color:"#E11D48" },
  { name:"Shopping",     value:3500,  color:"#7C3AED" },
  { name:"Others",       value:3950,  color:"#79716B" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number, cents = true) =>
  `₱${Math.abs(n).toLocaleString("en-PH", { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 })}`;

const cn = (...cls: (string | undefined | false | null)[]) => cls.filter(Boolean).join(" ");

// ─── Shared Atoms ─────────────────────────────────────────────────────────────

const Badge = ({ children, variant = "default", style }: {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "error" | "info";
  style?: React.CSSProperties;
}) => {
  const v = {
    default: "bg-muted text-muted-foreground",
    success:  "bg-green-50 text-green-700 border border-green-200",
    warning:  "bg-amber-50 text-amber-700 border border-amber-200",
    error:    "bg-red-50 text-red-700 border border-red-200",
    info:     "bg-blue-50 text-blue-700 border border-blue-200",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", v[variant])} style={style}>
      {children}
    </span>
  );
};

const StatusBadge = ({ status }: { status: ExpenseRecord["status"] }) => {
  const cfg = {
    paid:        { v:"success" as const, label:"Paid" },
    unpaid:      { v:"warning" as const, label:"Unpaid" },
    partial:     { v:"info" as const,    label:"Partial" },
    installment: { v:"info" as const,    label:"Installment" },
    overdue:     { v:"error" as const,   label:"Overdue" },
  };
  return <Badge variant={cfg[status].v}>{cfg[status].label}</Badge>;
};

const MetricCard = ({ title, value, subtitle, trend, icon: Icon, accent, ring = false }: {
  title: string; value: string; subtitle?: string;
  trend?: { value: string; up: boolean };
  icon?: React.ElementType; accent: string; ring?: boolean;
}) => (
  <div className={cn(
    "bg-card rounded-xl border border-border p-5 flex flex-col gap-3 hover:shadow-sm transition-shadow",
    ring ? "ring-1 ring-offset-0" : ""
  )} style={ring ? { "--tw-ring-color": accent + "30" } as React.CSSProperties : {}}>
    <div className="flex items-start justify-between">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
      {Icon && (
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: accent + "15", color: accent }}>
          <Icon size={14} />
        </div>
      )}
    </div>
    <div>
      <p className="text-2xl font-semibold tracking-tight text-foreground font-mono">{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </div>
    {trend && (
      <div className="flex items-center gap-1">
        {trend.up
          ? <ArrowUpRight size={12} className="text-green-600" />
          : <ArrowDownRight size={12} className="text-red-500" />}
        <span className={cn("text-xs font-medium", trend.up ? "text-green-600" : "text-red-500")}>{trend.value}</span>
        <span className="text-xs text-muted-foreground">vs last month</span>
      </div>
    )}
  </div>
);

const Drawer = ({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) => (
  <>
    {open && (
      <div className="fixed inset-0 z-40" onClick={onClose}
        style={{ backgroundColor: "rgba(0,0,0,0.25)" }} />
    )}
    <div className={cn(
      "fixed right-0 top-0 h-full w-full max-w-md bg-card z-50 shadow-2xl flex flex-col",
      "transition-transform duration-300 ease-out",
      open ? "translate-x-0" : "translate-x-full"
    )}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h3 className="font-semibold text-foreground">{title}</h3>
        <button onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground transition-colors">
          <X size={15} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-6">{children}</div>
    </div>
  </>
);

const Modal = ({ open, onClose, title, description, confirmLabel = "Confirm", onConfirm }: {
  open: boolean; onClose: () => void; title: string; description: string;
  confirmLabel?: string; onConfirm: () => void;
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.35)" }}>
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-border">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={17} className="text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-foreground bg-muted rounded-lg hover:bg-secondary transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-sm font-medium text-foreground">{label}</label>
    {children}
    {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
  </div>
);

const Input = ({ className, ...p }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input className={cn(
    "w-full px-3 py-2 text-sm bg-input-background border border-border rounded-lg",
    "focus:outline-none focus:ring-2 focus:ring-ring/30 text-foreground placeholder:text-muted-foreground transition-colors",
    className
  )} {...p} />
);

const Select = ({ className, children, ...p }: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select className={cn(
    "w-full px-3 py-2 text-sm bg-input-background border border-border rounded-lg",
    "focus:outline-none focus:ring-2 focus:ring-ring/30 text-foreground transition-colors",
    className
  )} {...p}>{children}</select>
);

const ComputedField = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
      {label}
      <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-normal border border-border">computed</span>
    </label>
    <div className="w-full px-3 py-2 text-sm bg-muted/60 border border-dashed border-border rounded-lg text-muted-foreground font-mono">
      {value}
    </div>
  </div>
);

const DrawerActions = ({ onClose, accent, submitLabel }: { onClose: () => void; accent: string; submitLabel: string }) => (
  <div className="flex gap-3 pt-2">
    <button onClick={onClose}
      className="flex-1 py-2.5 rounded-lg text-sm font-medium text-foreground bg-muted hover:bg-secondary transition-colors">
      Cancel
    </button>
    <button onClick={onClose}
      className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90"
      style={{ backgroundColor: accent }}>
      {submitLabel}
    </button>
  </div>
);

// ─── Landing Page ─────────────────────────────────────────────────────────────

function LandingPage({ accent, onGetStarted, onSignIn }: {
  accent: string; onGetStarted: () => void; onSignIn: () => void;
}) {
  const features = [
    { icon: LayoutDashboard, title: "Beautiful Dashboard",      desc: "See your full financial picture — balances, trends, budgets — at a glance." },
    { icon: Database,         title: "Notion as Source of Truth",desc: "All data lives in your Notion databases. This app is a better interface, not a replacement." },
    { icon: Zap,              title: "Faster Data Entry",        desc: "Smart forms that feel friendly. No fighting with table views or formula columns." },
    { icon: RefreshCw,        title: "One-Click Sync",           desc: "Push and pull changes with full transparency, activity logs, and conflict detection." },
    { icon: Shield,           title: "Hidden Complexity",        desc: "Complex formulas become clean read-only fields. You see results, not raw Notion logic." },
    { icon: Palette,          title: "Customizable Themes",      desc: "Choose your accent color, light or dark mode, and table density to suit your style." },
  ];

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-bold"
              style={{ backgroundColor: accent }}>N</div>
            <span className="font-semibold text-sm text-foreground">Notable Finance</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a>
            <a href="#notion" className="hover:text-foreground transition-colors">Notion sync</a>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onSignIn}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5">
              Sign In
            </button>
            <button onClick={onGetStarted}
              className="text-sm text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
              style={{ backgroundColor: accent }}>
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border border-border bg-card mb-8"
            style={{ color: accent }}>
            <Star size={10} fill={accent} />
            Powered by Notion · Designed for Finance
          </div>
          <h1 className="text-5xl md:text-[3.75rem] leading-tight font-normal text-foreground mb-5"
            style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
            A better finance UI for your
            <br />
            <span style={{ color: accent }}>Notion databases</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
            Track income, expenses, accounts, installments, and monthly budgets
            without fighting Notion table views. Your data stays in Notion — Notable makes it beautiful.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button onClick={onGetStarted}
              className="flex items-center gap-2 text-white px-7 py-3.5 rounded-xl font-medium hover:opacity-90 transition-all shadow-lg"
              style={{ backgroundColor: accent, boxShadow: `0 8px 32px ${accent}40` }}>
              Get Started Free <ArrowRight size={15} />
            </button>
            <button onClick={onSignIn}
              className="text-foreground px-6 py-3.5 rounded-xl font-medium border border-border hover:bg-muted transition-colors text-sm">
              View Demo
            </button>
          </div>
        </div>
      </section>

      {/* Product Mockup */}
      <section className="pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl border border-border overflow-hidden bg-muted/50"
            style={{ boxShadow: "0 40px 80px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05)" }}>
            <div className="px-4 py-2.5 flex items-center gap-1.5 border-b border-border bg-muted/60">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
              <div className="flex-1 mx-4 bg-card border border-border rounded h-5 flex items-center px-3">
                <span className="text-[10px] text-muted-foreground">app.notable.finance/dashboard</span>
              </div>
            </div>
            <div className="bg-background flex" style={{ minHeight: 340 }}>
              {/* Sidebar preview */}
              <div className="w-44 border-r border-border p-3 flex-shrink-0" style={{ backgroundColor: "#F7F6F4" }}>
                <div className="flex items-center gap-1.5 px-2 py-1.5 mb-3">
                  <div className="w-5 h-5 rounded flex items-center justify-center text-white text-[9px] font-bold"
                    style={{ backgroundColor: accent }}>N</div>
                  <span className="text-xs font-semibold text-foreground">Notable Finance</span>
                </div>
                {[
                  { label:"Dashboard",   active:true  },
                  { label:"Accounts",    active:false },
                  { label:"Income",      active:false },
                  { label:"Expenses",    active:false },
                  { label:"Monthly",     active:false },
                ].map(item => (
                  <div key={item.label}
                    className={cn("flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[10px] mb-0.5",
                      item.active ? "text-white" : "text-muted-foreground"
                    )}
                    style={item.active ? { backgroundColor: accent } : {}}>
                    <div className="w-1.5 h-1.5 rounded-sm bg-current opacity-50" />{item.label}
                  </div>
                ))}
              </div>
              {/* Dashboard preview */}
              <div className="flex-1 p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-semibold text-foreground">July 2025</p>
                  <div className="flex items-center gap-1.5 text-[10px] text-green-600">
                    <CheckCircle size={10} />Synced
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {[
                    { l:"Total Balance",   v:"₱209,530" },
                    { l:"Net Income",      v:"₱92,500" },
                    { l:"Expenses",        v:"₱31,216" },
                    { l:"Remaining",       v:"₱61,284", hi:true },
                  ].map(c => (
                    <div key={c.l} className={cn(
                      "rounded-lg p-2.5 border border-border",
                      c.hi ? "ring-1" : "bg-card"
                    )}
                    style={c.hi ? { backgroundColor: accent + "0C", "--tw-ring-color": accent + "30" } as React.CSSProperties : {}}>
                      <p className="text-[8px] text-muted-foreground mb-1">{c.l}</p>
                      <p className="text-[11px] font-semibold text-foreground font-mono">{c.v}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-card rounded-lg border border-border p-3">
                  <p className="text-[9px] text-muted-foreground mb-2">Income vs Expenses — 6 months</p>
                  <div className="flex gap-1 items-end h-14">
                    {[60,72,78,90,65,100].map((h, i) => (
                      <div key={i} className="flex-1 flex flex-col gap-0.5 items-center justify-end">
                        <div className="w-full rounded-sm opacity-80"
                          style={{ height: (h * 0.45) + "px", backgroundColor: accent }} />
                        <div className="w-full rounded-sm"
                          style={{ height: (h * 0.26) + "px", backgroundColor: "#E11D48" + "70" }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-normal text-foreground mb-2"
              style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
              Everything you need to manage your finances
            </h2>
            <p className="text-muted-foreground text-sm">Without the spreadsheet headache.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-card border border-border rounded-xl p-5 hover:shadow-sm transition-shadow">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-4"
                  style={{ backgroundColor: accent + "15", color: accent }}>
                  <Icon size={16} />
                </div>
                <h3 className="font-semibold text-foreground text-sm mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 px-6 bg-muted/40">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-normal text-foreground mb-2"
            style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
            Set up in minutes
          </h2>
          <p className="text-muted-foreground text-sm mb-12">Three steps to a better finance workflow.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { n:"01", title:"Connect Notion",   desc:"Add your integration token and map your existing databases. No import needed — your data stays where it is." },
              { n:"02", title:"Start Tracking",   desc:"Enter income, expenses, and account data through clean, guided forms. No Notion table editing required." },
              { n:"03", title:"Sync & Review",    desc:"Push all changes back to Notion with one click. View history, resolve conflicts, and keep full control." },
            ].map(s => (
              <div key={s.n} className="text-center">
                <div className="text-4xl font-normal mb-3" style={{ fontFamily: "'Instrument Serif', Georgia, serif", color: accent }}>{s.n}</div>
                <h3 className="font-semibold text-foreground mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Notion sync section */}
      <section id="notion" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card border border-border rounded-2xl p-10 md:flex gap-12 items-center">
            <div className="flex-1">
              <p className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: accent }}>
                <Database size={13} /> Notion Sync
              </p>
              <h2 className="text-3xl font-normal text-foreground mb-4"
                style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                Your data stays in Notion. Always.
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed mb-5">
                Notable Finance never replaces Notion. It connects via the Notion API and provides
                a better editing and viewing experience. Every change syncs back transparently.
              </p>
              <ul className="space-y-2">
                {["Full two-way sync — push and pull","Conflict detection and resolution","Complete sync history and activity log","Safe editing — review before pushing"].map(s => (
                  <li key={s} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle size={13} style={{ color: accent }} /> {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-shrink-0 mt-8 md:mt-0 flex flex-col items-center gap-3 w-44">
              <div className="w-full bg-muted rounded-xl p-4 border border-border text-center">
                <div className="w-8 h-8 bg-foreground rounded-lg mx-auto mb-2 flex items-center justify-center text-background text-xs font-bold">N</div>
                <p className="text-xs font-medium text-foreground">Notion</p>
                <p className="text-[10px] text-muted-foreground">Source of truth</p>
              </div>
              <div className="flex items-center gap-1 w-full justify-center">
                <div className="h-px flex-1 border-t border-dashed border-border" />
                <ArrowRight size={10} style={{ color: accent }} />
                <div className="h-px flex-1 border-t border-dashed border-border" />
              </div>
              <div className="w-full rounded-xl p-4 border text-center"
                style={{ backgroundColor: accent + "0E", borderColor: accent + "35" }}>
                <div className="w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: accent }}>N</div>
                <p className="text-xs font-medium text-foreground">Notable</p>
                <p className="text-[10px] text-muted-foreground">Better interface</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits comparison */}
      <section className="py-16 px-6 bg-muted/40">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-normal text-foreground text-center mb-8"
            style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
            Better than managing Notion tables directly
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              ["Fighting with formula columns",     "Clean computed read-only fields"],
              ["Accidental edits to formulas",      "Safe editing with form validation"],
              ["No visual charts or dashboards",    "Rich dashboard with live charts"],
              ["No installment progress tracking",  "Built-in installment progress bars"],
              ["Manual budget vs actual review",    "Category spending overview page"],
              ["No pasabuy tracking UI",            "Dedicated pasabuy management"],
            ].map(([before, after]) => (
              <div key={before} className="bg-card rounded-xl border border-border p-4 flex gap-4">
                <div className="flex-1">
                  <p className="text-[10px] text-muted-foreground mb-1">Without Notable</p>
                  <p className="text-sm text-muted-foreground line-through opacity-60">{before}</p>
                </div>
                <div className="w-px bg-border" />
                <div className="flex-1">
                  <p className="text-[10px] font-medium mb-1" style={{ color: accent }}>With Notable</p>
                  <p className="text-sm font-medium text-foreground">{after}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-4xl font-normal text-foreground mb-4"
            style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
            Start tracking smarter today
          </h2>
          <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
            Connect your Notion workspace and experience a better personal finance UI. Your data stays yours.
          </p>
          <button onClick={onGetStarted}
            className="flex items-center gap-2 text-white px-8 py-4 rounded-xl font-medium hover:opacity-90 transition-all shadow-lg mx-auto"
            style={{ backgroundColor: accent, boxShadow: `0 8px 32px ${accent}40` }}>
            Get Started for Free <ArrowRight size={15} />
          </button>
        </div>
      </section>

      <footer className="border-t border-border py-6 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded flex items-center justify-center text-white text-[9px] font-bold" style={{ backgroundColor: accent }}>N</div>
            <span className="text-sm font-medium text-foreground">Notable Finance</span>
          </div>
          <p className="text-xs text-muted-foreground">Notion-powered · Built for daily finance tracking</p>
        </div>
      </footer>
    </div>
  );
}

// ─── Auth Page ────────────────────────────────────────────────────────────────

function AuthPage({ view, onViewChange, onSignIn, accent }: {
  view: AuthView; onViewChange: (v: AuthView) => void;
  onSignIn: () => void; accent: string;
}) {
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); onSignIn(); }, 1200);
  };

  return (
    <div className="min-h-screen bg-background flex" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Sidebar panel */}
      <div className="hidden md:flex flex-col w-96 border-r border-border p-10 justify-between flex-shrink-0"
        style={{ backgroundColor: "#F7F6F4" }}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-bold"
            style={{ backgroundColor: accent }}>N</div>
          <span className="font-semibold text-sm text-foreground">Notable Finance</span>
        </div>
        <div>
          <blockquote className="text-xl font-normal text-foreground leading-relaxed mb-5"
            style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
            "Finally a finance app that talks to my Notion workspace. My monthly review went from 2 hours to 20 minutes."
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold text-white"
              style={{ backgroundColor: accent + "CC" }}>MS</div>
            <div>
              <p className="text-sm font-medium text-foreground">Maria Santos</p>
              <p className="text-xs text-muted-foreground">Software Engineer, Makati City</p>
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          {[1,2,3,4,5].map(i => <Star key={i} size={12} fill={accent} style={{ color: accent }} />)}
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-8 md:hidden">
            <div className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-bold"
              style={{ backgroundColor: accent }}>N</div>
            <span className="font-semibold text-sm text-foreground">Notable Finance</span>
          </div>
          <h2 className="text-2xl font-normal text-foreground mb-1"
            style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
            {view === "signin" ? "Welcome back" : "Create your account"}
          </h2>
          <p className="text-sm text-muted-foreground mb-8">
            {view === "signin" ? "Sign in to your Notable Finance account" : "Start your finance tracking journey"}
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            {view === "signup" && (
              <Field label="Full Name"><Input placeholder="Maria Santos" autoFocus /></Field>
            )}
            <Field label="Email"><Input type="email" placeholder="maria@example.com" /></Field>
            <Field label="Password">
              <div className="relative">
                <Input type={showPass ? "text" : "password"} placeholder="Enter your password" className="pr-10" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </Field>
            {view === "signup" && (
              <Field label="Confirm Password"><Input type="password" placeholder="Repeat your password" /></Field>
            )}
            {view === "signin" && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                  <input type="checkbox" className="rounded" />Remember me
                </label>
                <button type="button" className="text-sm font-medium" style={{ color: accent }}>
                  Forgot password?
                </button>
              </div>
            )}
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl text-white font-medium hover:opacity-90 flex items-center justify-center gap-2 transition-all mt-2"
              style={{ backgroundColor: accent }}>
              {loading && <RefreshCw size={14} className="animate-spin" />}
              {view === "signin" ? "Sign In" : "Create Account"}
            </button>
          </form>
          <p className="text-sm text-center text-muted-foreground mt-6">
            {view === "signin" ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => onViewChange(view === "signin" ? "signup" : "signin")}
              className="font-medium" style={{ color: accent }}>
              {view === "signin" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ activePage, onPageChange, accent, onSignOut }: {
  activePage: Page; onPageChange: (p: Page) => void; accent: string; onSignOut: () => void;
}) {
  return (
    <div className="flex flex-col h-full border-r border-border flex-shrink-0"
      style={{ width: 220, backgroundColor: "#F7F6F4", fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-center gap-2 px-4 py-4 border-b border-border">
        <div className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-bold"
          style={{ backgroundColor: accent }}>N</div>
        <div>
          <p className="text-sm font-semibold text-foreground">Notable Finance</p>
        </div>
      </div>
      <nav className="flex-1 p-2.5 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const active = activePage === id;
          return (
            <button key={id} onClick={() => onPageChange(id)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all",
                active ? "text-white font-medium" : "text-muted-foreground hover:text-foreground hover:bg-white/60"
              )}
              style={active ? { backgroundColor: accent } : {}}>
              <Icon size={14} />{label}
            </button>
          );
        })}
        <div className="pt-4 pb-1 px-3">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Settings</p>
        </div>
        {SETTINGS_ITEMS.map(({ id, label, icon: Icon }) => {
          const active = activePage === id;
          return (
            <button key={id} onClick={() => onPageChange(id)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all",
                active ? "text-white font-medium" : "text-muted-foreground hover:text-foreground hover:bg-white/60"
              )}
              style={active ? { backgroundColor: accent } : {}}>
              <Icon size={14} />{label}
            </button>
          );
        })}
      </nav>
      <div className="p-2.5 border-t border-border">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-semibold"
            style={{ backgroundColor: accent + "CC" }}>MS</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">Maria Santos</p>
            <p className="text-[10px] text-muted-foreground truncate">maria@example.com</p>
          </div>
          <button onClick={onSignOut}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 flex-shrink-0">
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Top Bar ──────────────────────────────────────────────────────────────────

function TopBar({ title, activePage, accent, syncState, onSync, selectedMonth, onMonthChange }: {
  title: string; activePage: Page; accent: string; syncState: SyncState;
  onSync: () => void; selectedMonth: number; onMonthChange: (m: number) => void;
}) {
  const showMonth = ["dashboard","income","expenses","monthly"].includes(activePage);
  const syncCfg = {
    idle:     { color:"text-muted-foreground", label:"Last synced 2m ago",   Icon:Clock },
    syncing:  { color:"text-amber-600",        label:"Syncing...",            Icon:RefreshCw },
    success:  { color:"text-green-600",        label:"Synced just now",      Icon:CheckCircle },
    error:    { color:"text-red-600",          label:"Sync failed",          Icon:AlertCircle },
    conflict: { color:"text-amber-600",        label:"Conflict detected",    Icon:AlertTriangle },
  };
  const { color, label, Icon: SyncIcon } = syncCfg[syncState];

  return (
    <div className="h-14 border-b border-border bg-background flex items-center justify-between px-6 flex-shrink-0"
      style={{ fontFamily: "'Inter', sans-serif" }}>
      <h1 className="font-semibold text-foreground">{title}</h1>
      <div className="flex items-center gap-4">
        {showMonth && (
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <button onClick={() => onMonthChange((selectedMonth - 1 + 12) % 12)}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-background transition-colors text-muted-foreground">
              <ChevronLeft size={13} />
            </button>
            <span className="text-sm font-medium text-foreground px-2 min-w-[100px] text-center">
              {MONTHS[selectedMonth]} 2025
            </span>
            <button onClick={() => onMonthChange((selectedMonth + 1) % 12)}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-background transition-colors text-muted-foreground">
              <ChevronRight size={13} />
            </button>
          </div>
        )}
        <div className={cn("flex items-center gap-1.5 text-xs", color)}>
          <SyncIcon size={12} className={syncState === "syncing" ? "animate-spin" : ""} />
          <span className="hidden sm:inline">{label}</span>
        </div>
        <button onClick={onSync} disabled={syncState === "syncing"}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white hover:opacity-90 disabled:opacity-60 transition-all"
          style={{ backgroundColor: accent }}>
          <RefreshCw size={11} className={syncState === "syncing" ? "animate-spin" : ""} />
          Sync
        </button>
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-semibold"
          style={{ backgroundColor: accent + "CC" }}>MS</div>
      </div>
    </div>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────

function DashboardPage({ accent, selectedMonth }: { accent: string; selectedMonth: number }) {
  const recent = [
    { date:"Jul 15", name:"July Salary — Accenture",  cat:"Employment",     amt:72500,  dir:1 },
    { date:"Jul 05", name:"Freelance — Globe API",    cat:"Freelance",      amt:20000,  dir:1 },
    { date:"Jul 03", name:"S&R Groceries",            cat:"Food & Dining",  amt:3500,   dir:-1 },
    { date:"Jul 02", name:"Grab Monthly Load",        cat:"Transportation", amt:2200,   dir:-1 },
    { date:"Jul 01", name:"Pasig Studio Rent",        cat:"Housing",        amt:12500,  dir:-1 },
  ];
  const dues = [
    { name:"Metrobank Credit Card", due:"Aug 10", amt:45800, urgent:true },
    { name:"BPI Amore Platinum",    due:"Aug 15", amt:87500, urgent:false },
    { name:"Meralco Bill",          due:"Aug 05", amt:1800,  urgent:true },
  ];
  const piesWithAccent = categoryPieData.map((d, i) => ({ ...d, color: i === 0 ? accent : d.color }));

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Balance"    value={fmt(209530.75)} subtitle="All accounts combined" icon={Wallet}     accent={accent} trend={{ value:"12.4%", up:true }} />
        <MetricCard title="Monthly Net Income" value={fmt(92500)}   subtitle={`${MONTHS[selectedMonth]} 2025`}         icon={TrendingUp} accent={accent} trend={{ value:"8.8%", up:true }} />
        <MetricCard title="Monthly Expenses" value={fmt(31216.67)} subtitle="Budget ₱45,000"         icon={Receipt}    accent={accent} trend={{ value:"5.1%", up:false }} />
        <MetricCard title="Remaining Budget" value={fmt(61283.33)} subtitle="68% of net income"      icon={Target}     accent={accent} ring />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Available Credit"  value={fmt(216700)}  subtitle="Limit ₱350,000"          icon={CreditCard} accent={accent} />
        <MetricCard title="Monthly Gross"     value={fmt(110000)}  subtitle="Before deductions"       icon={Banknote}   accent={accent} />
        <MetricCard title="Pasabuy Balance"   value={fmt(8000)}    subtitle="1 active pasabuy"        icon={PiggyBank}  accent={accent} />
        <MetricCard title="CC Balance Total"  value={fmt(133300)}  subtitle="2 credit cards"          icon={AlertTriangle} accent={accent} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="font-semibold text-foreground text-sm">Income vs Expenses</p>
              <p className="text-xs text-muted-foreground">Last 6 months</p>
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: accent }} />Income
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />Expenses
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={accent} stopOpacity={0.18} />
                  <stop offset="95%" stopColor={accent} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#E11D48" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#E11D48" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#79716B" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#79716B" }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `₱${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number, n: string) => [fmt(v), n === "income" ? "Income" : "Expenses"]}
                contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid var(--border)", backgroundColor: "var(--card)" }} />
              <Area type="monotone" dataKey="income"   stroke={accent}    strokeWidth={2} fill="url(#gIncome)" />
              <Area type="monotone" dataKey="expenses" stroke="#E11D48" strokeWidth={2} fill="url(#gExpense)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="font-semibold text-foreground text-sm mb-1">Spending Breakdown</p>
          <p className="text-xs text-muted-foreground mb-2">{MONTHS[selectedMonth]} 2025</p>
          <ResponsiveContainer width="100%" height={130}>
            <PieChart>
              <Pie data={piesWithAccent} cx="50%" cy="50%" innerRadius={38} outerRadius={60} dataKey="value" stroke="none">
                {piesWithAccent.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={(v: number) => fmt(v)}
                contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid var(--border)", backgroundColor: "var(--card)" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-1">
            {piesWithAccent.slice(0,5).map((d) => (
              <div key={d.name} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="text-xs text-muted-foreground">{d.name}</span>
                </div>
                <span className="text-xs font-mono text-foreground">{fmt(d.value, false)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="font-semibold text-foreground text-sm">Recent Transactions</p>
            <button className="text-xs font-medium" style={{ color: accent }}>View all</button>
          </div>
          <div className="space-y-3">
            {recent.map((tx, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", tx.dir > 0 ? "bg-green-50" : "bg-red-50/80")}>
                    {tx.dir > 0
                      ? <ArrowDownRight size={13} className="text-green-600" />
                      : <ArrowUpRight   size={13} className="text-red-500" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{tx.name}</p>
                    <p className="text-xs text-muted-foreground">{tx.cat} · {tx.date}</p>
                  </div>
                </div>
                <span className={cn("text-sm font-semibold font-mono", tx.dir > 0 ? "text-green-600" : "text-foreground")}>
                  {tx.dir > 0 ? "+" : "-"}{fmt(tx.amt, false)}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="font-semibold text-foreground text-sm">Upcoming Due Payments</p>
            <Badge variant="warning">3 due soon</Badge>
          </div>
          <div className="space-y-2.5 mb-4">
            {dues.map((d, i) => (
              <div key={i} className={cn(
                "flex items-center justify-between p-3 rounded-lg border",
                d.urgent ? "border-amber-200 bg-amber-50/60" : "border-border bg-background"
              )}>
                <div className="flex items-center gap-3">
                  <CreditCard size={14} className={d.urgent ? "text-amber-600" : "text-muted-foreground"} />
                  <div>
                    <p className="text-sm font-medium text-foreground">{d.name}</p>
                    <p className="text-xs text-muted-foreground">Due {d.due}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold font-mono">{fmt(d.amt, false)}</p>
                  {d.urgent && <Badge variant="warning">Soon</Badge>}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Budget Usage</p>
            <div className="space-y-2.5">
              {mockExpenseCategories.slice(0,3).map(cat => {
                const pct = Math.min(Math.round((cat.spending / cat.monthlyBudget) * 100), 100);
                return (
                  <div key={cat.id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{cat.name}</span>
                      <span className="font-mono text-foreground">{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: pct > 90 ? "#E11D48" : pct > 75 ? "#D97706" : accent }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Accounts Page ────────────────────────────────────────────────────────────

function AccountsPage({ accent }: { accent: string }) {
  const [accounts, setAccounts] = useState<Account[]>(mockAccounts);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const typeLabel: Record<Account["type"], string> = {
    checking:"Checking", savings:"Savings", credit:"Credit Card", "e-wallet":"E-Wallet"
  };
  const typeVariant: Record<Account["type"], "info"|"success"|"warning"|"default"> = {
    checking:"info", savings:"success", credit:"warning", "e-wallet":"default"
  };

  const filtered = accounts.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) &&
    (typeFilter === "all" || a.type === typeFilter)
  );
  const totalAssets = accounts.filter(a => a.balance > 0).reduce((s, a) => s + a.balance, 0);
  const totalCredit = accounts.filter(a => a.type === "credit").reduce((s, a) => s + (a.creditLimit || 0), 0);

  const openAdd  = () => { setEditing(null); setDrawerOpen(true); };
  const openEdit = (a: Account) => { setEditing(a); setDrawerOpen(true); };

  return (
    <div className="flex-1 overflow-y-auto p-6" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-5 text-sm text-muted-foreground">
          <span>Total assets: <span className="font-semibold text-green-600 font-mono">{fmt(totalAssets)}</span></span>
          <span>Total credit limit: <span className="font-semibold font-mono text-foreground">{fmt(totalCredit)}</span></span>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-all"
          style={{ backgroundColor: accent }}>
          <Plus size={14} />Add Account
        </button>
      </div>
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm bg-muted rounded-lg border border-border focus:outline-none"
            placeholder="Search accounts…" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="px-3 py-2 text-sm bg-muted rounded-lg border border-border text-foreground focus:outline-none">
          <option value="all">All types</option>
          <option value="checking">Checking</option>
          <option value="savings">Savings</option>
          <option value="credit">Credit Card</option>
          <option value="e-wallet">E-Wallet</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(a => {
          const util = a.creditLimit ? Math.round((Math.abs(a.balance) / a.creditLimit) * 100) : null;
          return (
            <div key={a.id}
              className="bg-card border border-border rounded-xl p-5 hover:shadow-sm transition-shadow cursor-pointer group"
              onClick={() => openEdit(a)}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-semibold text-foreground text-sm mb-1.5">{a.name}</p>
                  <Badge variant={typeVariant[a.type]}>{typeLabel[a.type]}</Badge>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={e => { e.stopPropagation(); openEdit(a); }}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground">
                    <Edit2 size={12} />
                  </button>
                  <button onClick={e => { e.stopPropagation(); setDeleteTarget(a); }}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              <p className={cn("text-2xl font-semibold tracking-tight font-mono mb-1", a.balance < 0 ? "text-red-600" : "text-foreground")}>
                {a.balance < 0 ? "-" : ""}{fmt(Math.abs(a.balance))}
              </p>
              {a.type === "credit" && a.creditLimit && util !== null && (
                <div className="mt-3 space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Available: <span className="text-foreground font-mono">{fmt(a.available || 0)}</span></span>
                    <span className={cn("font-medium", util > 80 ? "text-red-600" : util > 60 ? "text-amber-600" : "text-green-600")}>
                      {util}% used
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{
                      width: `${util}%`,
                      backgroundColor: util > 80 ? "#E11D48" : util > 60 ? "#D97706" : accent
                    }} />
                  </div>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    {a.billingDay && <span>Billing: {a.billingDay}th</span>}
                    {a.dueDay && <span>Due: <span className="text-amber-600 font-medium">{a.dueDay}th</span></span>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <button onClick={openAdd}
          className="border-2 border-dashed border-border rounded-xl p-5 flex flex-col items-center justify-center gap-2 hover:border-muted-foreground/30 transition-colors min-h-36">
          <div className="w-9 h-9 rounded-lg border-2 border-dashed border-border flex items-center justify-center">
            <Plus size={15} className="text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Add Account</p>
        </button>
      </div>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}
        title={editing ? "Edit Account" : "Add Account"}>
        <div className="space-y-4">
          <Field label="Account Name"><Input defaultValue={editing?.name} placeholder="e.g. BDO Checking Account" /></Field>
          <Field label="Account Type">
            <Select defaultValue={editing?.type || "checking"}>
              <option value="checking">Checking</option>
              <option value="savings">Savings</option>
              <option value="credit">Credit Card</option>
              <option value="e-wallet">E-Wallet</option>
            </Select>
          </Field>
          <Field label="Current Balance"><Input type="number" defaultValue={editing?.balance} placeholder="0.00" /></Field>
          <Field label="Credit Limit" hint="Leave empty for non-credit accounts">
            <Input type="number" defaultValue={editing?.creditLimit || ""} placeholder="0.00" />
          </Field>
          <Field label="Billing Day" hint="Day of month billing statement generates">
            <Input type="number" defaultValue={editing?.billingDay || ""} placeholder="15" />
          </Field>
          <Field label="Due Day" hint="Day of month payment is due">
            <Input type="number" defaultValue={editing?.dueDay || ""} placeholder="10" />
          </Field>
          <DrawerActions onClose={() => setDrawerOpen(false)} accent={accent} submitLabel={editing ? "Save Changes" : "Add Account"} />
        </div>
      </Drawer>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        title="Delete Account"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This will also remove it from Notion on next sync.`}
        confirmLabel="Delete Account"
        onConfirm={() => { setAccounts(a => a.filter(x => x.id !== deleteTarget?.id)); setDeleteTarget(null); }} />
    </div>
  );
}

// ─── Income Page ──────────────────────────────────────────────────────────────

function IncomePage({ accent, selectedMonth }: { accent: string; selectedMonth: number }) {
  const [tab, setTab] = useState<"records"|"categories">("records");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<IncomeRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [records, setRecords] = useState(mockIncomeRecords);

  const totalGross = records.reduce((s, r) => s + r.grossIncome, 0);
  const totalNet   = records.reduce((s, r) => s + r.netIncome, 0);

  return (
    <div className="flex-1 overflow-y-auto p-6" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <MetricCard title="Gross Income"     value={fmt(totalGross)} icon={TrendingUp}   accent={accent} />
        <MetricCard title="Total Deductions" value={fmt(totalGross - totalNet)} icon={TrendingDown} accent={accent} />
        <MetricCard title="Net Income"       value={fmt(totalNet)}   icon={Banknote}     accent={accent} ring />
      </div>
      <div className="flex items-center justify-between mb-5">
        <div className="flex bg-muted rounded-lg p-1 gap-1">
          {(["records","categories"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={cn("px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                tab === t ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
              {t === "records" ? "Income Records" : "Income Categories"}
            </button>
          ))}
        </div>
        {tab === "records" && (
          <button onClick={() => { setEditing(null); setDrawerOpen(true); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white hover:opacity-90"
            style={{ backgroundColor: accent }}>
            <Plus size={14} />Add Income
          </button>
        )}
      </div>

      {tab === "records" && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Name","Date","Gross Income","Deductions","Net Income","Category","Account",""].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map(r => (
                <tr key={r.id} className="border-b border-border hover:bg-muted/20 transition-colors cursor-pointer"
                  onClick={() => { setEditing(r); setDrawerOpen(true); }}>
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{r.name}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground font-mono whitespace-nowrap">{r.date}</td>
                  <td className="px-4 py-3 text-sm font-mono text-green-600 whitespace-nowrap">{fmt(r.grossIncome)}</td>
                  <td className="px-4 py-3 text-sm font-mono text-muted-foreground whitespace-nowrap">{fmt(r.capex)}</td>
                  <td className="px-4 py-3 text-sm font-mono font-semibold text-foreground whitespace-nowrap">{fmt(r.netIncome)}</td>
                  <td className="px-4 py-3"><Badge>{r.category}</Badge></td>
                  <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">{r.account}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={e => { e.stopPropagation(); setEditing(r); setDrawerOpen(true); }}
                        className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted text-muted-foreground"><Edit2 size={12} /></button>
                      <button onClick={e => { e.stopPropagation(); setDeleteTarget(r.id); }}
                        className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-50 text-muted-foreground hover:text-red-600"><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "categories" && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Source","Monthly Earnings","Expenditure","Monthly Gross","Earning %"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockIncomeCategories.map(c => (
                <tr key={c.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{c.source}</td>
                  <td className="px-4 py-3 text-sm font-mono text-green-600">{fmt(c.monthlyEarnings)}</td>
                  <td className="px-4 py-3 text-sm font-mono text-muted-foreground">{fmt(c.monthlyExpenditure)}</td>
                  <td className="px-4 py-3 text-sm font-mono font-semibold text-foreground">{fmt(c.monthlyGross)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${c.earningPercentage}%`, backgroundColor: accent }} />
                      </div>
                      <span className="text-xs font-mono text-muted-foreground">{c.earningPercentage}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}
        title={editing ? "Edit Income Record" : "Add Income Record"}>
        <div className="space-y-4">
          <Field label="Name / Description"><Input defaultValue={editing?.name} placeholder="e.g. July Salary — Accenture" /></Field>
          <Field label="Date"><Input type="date" defaultValue={editing?.date} /></Field>
          <Field label="Gross Income"><Input type="number" defaultValue={editing?.grossIncome} placeholder="0.00" /></Field>
          <Field label="Capital Expenditure / Deductions"><Input type="number" defaultValue={editing?.capex} placeholder="0.00" /></Field>
          <ComputedField label="Net Income" value={editing ? fmt(editing.netIncome) : "₱0.00"} />
          <Field label="Category">
            <Select defaultValue={editing?.category}>
              <option>Employment</option><option>Freelance</option>
              <option>Dividends</option><option>Side Business</option><option>Other</option>
            </Select>
          </Field>
          <Field label="Account">
            <Select defaultValue={editing?.account}>
              {mockAccounts.map(a => <option key={a.id}>{a.name}</option>)}
            </Select>
          </Field>
          <Field label="Transaction Account">
            <Select defaultValue={editing?.transactionAccount}>
              {mockAccounts.map(a => <option key={a.id}>{a.name}</option>)}
            </Select>
          </Field>
          <DrawerActions onClose={() => setDrawerOpen(false)} accent={accent} submitLabel={editing ? "Save Changes" : "Add Income"} />
        </div>
      </Drawer>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        title="Delete Income Record" description="Are you sure? This cannot be undone."
        confirmLabel="Delete" onConfirm={() => { setRecords(r => r.filter(x => x.id !== deleteTarget)); setDeleteTarget(null); }} />
    </div>
  );
}

// ─── Expenses Page ────────────────────────────────────────────────────────────

function ExpensesPage({ accent }: { accent: string }) {
  const [tab, setTab]           = useState<"records"|"categories">("records");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing]   = useState<ExpenseRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [records, setRecords]   = useState(mockExpenseRecords);
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = records.filter(r => statusFilter === "all" || r.status === statusFilter);
  const totalAmt  = records.reduce((s, r) => s + r.amount, 0);
  const totalPaid = records.reduce((s, r) => s + r.paidAmount, 0);

  return (
    <div className="flex-1 overflow-y-auto p-6" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <MetricCard title="Total Expenses" value={fmt(totalAmt)}          icon={Receipt}    accent={accent} />
        <MetricCard title="Amount Paid"    value={fmt(totalPaid)}         icon={CheckCheck} accent={accent} />
        <MetricCard title="Outstanding"    value={fmt(totalAmt-totalPaid)} icon={Clock}     accent={accent} ring />
      </div>
      <div className="flex items-center justify-between mb-5">
        <div className="flex bg-muted rounded-lg p-1 gap-1">
          {(["records","categories"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={cn("px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                tab === t ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
              {t === "records" ? "Expense Records" : "Expense Categories"}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {tab === "records" && (
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm bg-muted rounded-lg border border-border text-foreground focus:outline-none">
              <option value="all">All Status</option>
              <option value="paid">Paid</option><option value="unpaid">Unpaid</option>
              <option value="partial">Partial</option><option value="installment">Installment</option>
              <option value="overdue">Overdue</option>
            </select>
          )}
          {tab === "records" && (
            <button onClick={() => { setEditing(null); setDrawerOpen(true); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white hover:opacity-90"
              style={{ backgroundColor: accent }}>
              <Plus size={14} />Add Expense
            </button>
          )}
        </div>
      </div>

      {tab === "records" && (
        <div className="bg-card border border-border rounded-xl overflow-auto">
          <table className="w-full min-w-max">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Description","Date","Amount","Account","Category","Status","Frequency",""].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-b border-border hover:bg-muted/20 transition-colors cursor-pointer"
                  onClick={() => { setEditing(r); setDrawerOpen(true); }}>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-foreground">{r.description}</p>
                    {r.pasabuyer && <p className="text-xs text-muted-foreground">via {r.pasabuyer}</p>}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground font-mono whitespace-nowrap">{r.purchaseDate}</td>
                  <td className="px-4 py-3 text-sm font-semibold font-mono whitespace-nowrap">{fmt(r.amount)}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">{r.account}</td>
                  <td className="px-4 py-3 whitespace-nowrap"><Badge>{r.category}</Badge></td>
                  <td className="px-4 py-3 whitespace-nowrap"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-muted-foreground capitalize">{r.frequency}</span>
                    {r.frequency === "installment" && r.periodCount && (
                      <p className="text-xs text-muted-foreground">{r.paidPeriod}/{r.periodCount} paid</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={e => { e.stopPropagation(); setEditing(r); setDrawerOpen(true); }}
                        className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted text-muted-foreground"><Edit2 size={12} /></button>
                      <button onClick={e => { e.stopPropagation(); setDeleteTarget(r.id); }}
                        className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-50 text-muted-foreground hover:text-red-600"><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "categories" && (
        <div className="space-y-3">
          {mockExpenseCategories.map(cat => {
            const pct = Math.round((cat.spending / cat.monthlyBudget) * 100);
            const rem = cat.monthlyBudget - cat.spending;
            return (
              <div key={cat.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-2.5">
                  <p className="font-semibold text-foreground text-sm">{cat.name}</p>
                  <div className="flex items-center gap-3 text-sm font-mono">
                    <span className="text-muted-foreground">Budget: {fmt(cat.monthlyBudget, false)}</span>
                    <span className="text-foreground">Spent: {fmt(cat.spending, false)}</span>
                    <span className={cn("font-semibold", rem >= 0 ? "text-green-600" : "text-red-600")}>
                      {rem >= 0 ? "+" : ""}{fmt(rem, false)} left
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: pct > 100 ? "#E11D48" : pct > 85 ? "#D97706" : accent }} />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-xs text-muted-foreground">{pct}% of budget used</span>
                  {pct > 85 && <Badge variant={pct > 100 ? "error" : "warning"}>{pct > 100 ? "Over budget!" : "Near limit"}</Badge>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}
        title={editing ? "Edit Expense" : "Add Expense"}>
        <div className="space-y-4">
          <Field label="Description"><Input defaultValue={editing?.description} placeholder="e.g. S&R Groceries" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Purchase Date"><Input type="date" defaultValue={editing?.purchaseDate} /></Field>
            <Field label="Date Paid"><Input type="date" defaultValue={editing?.datePaid || ""} /></Field>
          </div>
          <Field label="Amount"><Input type="number" defaultValue={editing?.amount} placeholder="0.00" /></Field>
          <Field label="Interest"><Input type="number" defaultValue={editing?.interest || 0} placeholder="0.00" /></Field>
          <Field label="Account">
            <Select defaultValue={editing?.account}>
              {mockAccounts.map(a => <option key={a.id}>{a.name}</option>)}
            </Select>
          </Field>
          <Field label="Category">
            <Select defaultValue={editing?.category}>
              {mockExpenseCategories.map(c => <option key={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Payment Status">
              <Select defaultValue={editing?.status}>
                <option value="paid">Paid</option><option value="unpaid">Unpaid</option>
                <option value="partial">Partial</option><option value="installment">Installment</option>
                <option value="overdue">Overdue</option>
              </Select>
            </Field>
            <Field label="Frequency">
              <Select defaultValue={editing?.frequency}>
                <option value="one-time">One-time</option><option value="monthly">Monthly</option>
                <option value="installment">Installment</option><option value="recurring">Recurring</option>
              </Select>
            </Field>
          </div>
          {editing?.frequency === "installment" && (
            <div className="bg-muted/50 rounded-xl p-4 space-y-3 border border-dashed border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Installment Details</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Period Count"><Input type="number" defaultValue={editing?.periodCount || ""} placeholder="12" /></Field>
                <Field label="Paid Period"><Input type="number" defaultValue={editing?.paidPeriod || ""} placeholder="3" /></Field>
              </div>
              <ComputedField label="Installment Amount" value={editing?.installmentAmount ? fmt(editing.installmentAmount) : "₱0.00"} />
            </div>
          )}
          <Field label="Pasabuyer" hint="Name of person who purchased on your behalf">
            <Input defaultValue={editing?.pasabuyer || ""} placeholder="Optional" />
          </Field>
          <ComputedField label="Pasabuyer Balance" value="₱0.00" />
          <DrawerActions onClose={() => setDrawerOpen(false)} accent={accent} submitLabel={editing ? "Save Changes" : "Add Expense"} />
        </div>
      </Drawer>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        title="Delete Expense"
        description="Are you sure? This will also remove the record from Notion on next sync."
        confirmLabel="Delete Expense"
        onConfirm={() => { setRecords(r => r.filter(x => x.id !== deleteTarget)); setDeleteTarget(null); }} />
    </div>
  );
}

// ─── Monthly Monitoring Page ──────────────────────────────────────────────────

function MonthlyPage({ accent, selectedMonth }: { accent: string; selectedMonth: number }) {
  const installments = [
    { name:"iPhone 15 Pro — Apple Store PH", total:45000, paid:3,  periods:12, monthly:3866.67 },
    { name:"MacBook Air M3 — Shopee",         total:72000, paid:7,  periods:12, monthly:6200 },
  ];
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Overview */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-semibold text-foreground text-lg">{MONTHS[selectedMonth]} 2025 Overview</p>
            <p className="text-sm text-muted-foreground">Monthly financial summary and monitoring</p>
          </div>
          <Badge variant="success"><CheckCircle size={11} />All income synced</Badge>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {[
            { label:"Gross Income",  value:"₱110,000",  color:"text-green-600" },
            { label:"Net Income",    value:"₱92,500",   color:"text-green-600" },
            { label:"Total Expenses",value:"₱31,216",   color:"text-red-500" },
            { label:"Remaining",     value:"₱61,284",   color:"text-foreground font-bold" },
          ].map(({ label, value, color }) => (
            <div key={label}>
              <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">{label}</p>
              <p className={cn("text-2xl font-semibold font-mono", color)}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pasabuy */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="font-semibold text-foreground">Pasabuy Status</p>
          <Badge variant="warning">1 outstanding</Badge>
        </div>
        <div className="border border-amber-200 rounded-xl bg-amber-50/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Amazon Purchase via Ate Mara</p>
              <p className="text-xs text-muted-foreground">Purchased Jul 5 · Account: BPI Amore Platinum</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold font-mono">₱8,000.00</p>
              <Badge variant="warning">Awaiting payment</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* CC dues */}
      <div className="bg-card border border-border rounded-xl p-5">
        <p className="font-semibold text-foreground mb-4">Credit Card Due Summary</p>
        <div className="space-y-3">
          {[
            { name:"Metrobank Credit Card", due:"Aug 10", amt:45800, paid:false },
            { name:"BPI Amore Platinum",    due:"Aug 15", amt:87500, paid:false },
          ].map(cc => (
            <div key={cc.name} className="flex items-center justify-between p-3.5 rounded-xl border border-border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                  <CreditCard size={15} className="text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{cc.name}</p>
                  <p className="text-xs text-muted-foreground">Due: {cc.due}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold font-mono">{fmt(cc.amt)}</p>
                <Badge variant={cc.paid ? "success" : "warning"}>{cc.paid ? "Paid" : "Unpaid"}</Badge>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Installments */}
      <div className="bg-card border border-border rounded-xl p-5">
        <p className="font-semibold text-foreground mb-4">Installment Progress</p>
        <div className="space-y-4">
          {installments.map(inst => {
            const pct = Math.round((inst.paid / inst.periods) * 100);
            return (
              <div key={inst.name}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-foreground">{inst.name}</p>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-muted-foreground font-mono">{fmt(inst.monthly)}/mo</span>
                    <Badge variant="info">{inst.paid}/{inst.periods} months</Badge>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: accent }} />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-muted-foreground">{pct}% complete</span>
                  <span className="text-xs text-muted-foreground font-mono">
                    {fmt((inst.periods - inst.paid) * inst.monthly, false)} remaining
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category spending */}
      <div className="bg-card border border-border rounded-xl p-5">
        <p className="font-semibold text-foreground mb-4">Category Spending Overview</p>
        <div className="space-y-3">
          {mockExpenseCategories.map(cat => {
            const pct = Math.round((cat.spending / cat.monthlyBudget) * 100);
            return (
              <div key={cat.id} className="flex items-center gap-4">
                <div className="w-28 text-sm text-muted-foreground flex-shrink-0 truncate">{cat.name}</div>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{
                    width: `${Math.min(pct, 100)}%`,
                    backgroundColor: pct > 100 ? "#E11D48" : pct > 85 ? "#D97706" : accent
                  }} />
                </div>
                <div className="w-28 text-right flex-shrink-0">
                  <span className="text-xs font-mono text-foreground">{fmt(cat.spending, false)}</span>
                  <span className="text-xs text-muted-foreground"> / {fmt(cat.monthlyBudget, false)}</span>
                </div>
                {pct > 85 && <Badge variant={pct > 100 ? "error" : "warning"}>{pct}%</Badge>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Sync Center Page ─────────────────────────────────────────────────────────

function SyncCenterPage({ accent, syncState, onSync }: {
  accent: string; syncState: SyncState; onSync: () => void;
}) {
  const stateCfg = {
    idle:     { bg:"bg-muted",                                 Icon:Clock,        color:"text-muted-foreground", label:"Ready to sync",    desc:"All changes are up to date" },
    syncing:  { bg:"bg-amber-50 border border-amber-200",      Icon:RefreshCw,    color:"text-amber-600",        label:"Syncing…",         desc:"Pushing and pulling Notion data" },
    success:  { bg:"bg-green-50 border border-green-200",      Icon:CheckCircle,  color:"text-green-600",        label:"Sync complete",    desc:"All records successfully synced" },
    error:    { bg:"bg-red-50 border border-red-200",          Icon:AlertCircle,  color:"text-red-600",          label:"Sync failed",      desc:"One or more records failed to sync" },
    conflict: { bg:"bg-amber-50 border border-amber-200",      Icon:AlertTriangle,color:"text-amber-600",        label:"Conflict detected",desc:"Manual review required for 1 record" },
  };
  const { bg, Icon: StatusIcon, color, label, desc } = stateCfg[syncState];

  const logCfg = {
    created:  { Icon:Plus,          color:"text-green-600",  bg:"bg-green-50",  label:"Created" },
    updated:  { Icon:Edit2,         color:"text-blue-600",   bg:"bg-blue-50",   label:"Updated" },
    deleted:  { Icon:Trash2,        color:"text-red-600",    bg:"bg-red-50",    label:"Deleted" },
    pulled:   { Icon:ArrowDownRight,color:"text-indigo-600", bg:"bg-indigo-50", label:"Pulled" },
    conflict: { Icon:AlertTriangle, color:"text-amber-600",  bg:"bg-amber-50",  label:"Conflict" },
    error:    { Icon:AlertCircle,   color:"text-red-600",    bg:"bg-red-50",    label:"Error" },
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Status */}
      <div className={cn("rounded-xl p-5", bg)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <StatusIcon size={20} className={cn(color, syncState === "syncing" ? "animate-spin" : "")} />
            <div>
              <p className="font-semibold text-foreground">{label}</p>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          </div>
          <button onClick={onSync} disabled={syncState === "syncing"}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: accent }}>
            <RefreshCw size={13} className={syncState === "syncing" ? "animate-spin" : ""} />
            {syncState === "syncing" ? "Syncing…" : "Sync Now"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:"Pending Changes", value:"3",   Icon:Clock,        iconColor:"text-amber-600", iconBg:"bg-amber-50" },
          { label:"Synced Records",  value:"247", Icon:CheckCircle,  iconColor:"text-green-600", iconBg:"bg-green-50" },
          { label:"Failed Records",  value:"1",   Icon:AlertCircle,  iconColor:"text-red-600",   iconBg:"bg-red-50" },
          { label:"Conflicts",       value:"1",   Icon:AlertTriangle,iconColor:"text-amber-600", iconBg:"bg-amber-50" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-3", s.iconBg)}>
              <s.Icon size={14} className={s.iconColor} />
            </div>
            <p className="text-2xl font-semibold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { label:"Pull from Notion",    desc:"Get latest changes from all Notion databases",       Icon:ArrowDownRight },
          { label:"Push to Notion",      desc:"Push all pending local changes to Notion",           Icon:ArrowUpRight },
        ].map(a => (
          <button key={a.label}
            className="flex items-center gap-4 bg-card border border-border rounded-xl p-4 hover:shadow-sm transition-shadow text-left group">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: accent + "15", color: accent }}>
              <a.Icon size={18} />
            </div>
            <div>
              <p className="font-medium text-foreground text-sm">{a.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{a.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Conflict warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground mb-1">Conflict Detected</p>
            <p className="text-sm text-muted-foreground mb-3">
              "Amazon Purchase — Pasabuy" was modified both locally and in Notion.
              Choose which version to keep.
            </p>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 text-xs font-medium bg-card border border-amber-200 rounded-lg text-foreground hover:bg-amber-100 transition-colors">
                Keep Local
              </button>
              <button className="px-3 py-1.5 text-xs font-medium bg-card border border-amber-200 rounded-lg text-foreground hover:bg-amber-100 transition-colors">
                Keep Notion
              </button>
              <button className="px-3 py-1.5 text-xs font-medium text-amber-700 hover:underline transition-all">
                View diff
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Activity log */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <p className="font-semibold text-foreground text-sm">Sync Activity Log</p>
          <span className="text-xs text-muted-foreground">{mockSyncLog.length} entries</span>
        </div>
        <div className="divide-y divide-border">
          {mockSyncLog.map(entry => {
            const { Icon: EntryIcon, color: eColor, bg: eBg, label: eLabel } = logCfg[entry.type];
            return (
              <div key={entry.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-muted/20 transition-colors">
                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5", eBg)}>
                  <EntryIcon size={12} className={eColor} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={cn("text-xs font-semibold", eColor)}>{eLabel}</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">{entry.entity}</span>
                  </div>
                  <p className="text-sm text-foreground">{entry.description}</p>
                </div>
                <span className="text-xs text-muted-foreground font-mono flex-shrink-0">{entry.timestamp.split(" ")[1]}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Notion Settings Page ─────────────────────────────────────────────────────

function NotionSettingsPage({ accent }: { accent: string }) {
  const [showToken, setShowToken] = useState(false);
  const [testState, setTestState] = useState<"idle"|"testing"|"success"|"error">("idle");
  const [saved, setSaved] = useState(false);

  const dbOptions = [
    "Finance — Accounts (2025)",   "Finance — Income Categories",
    "Finance — Income Records",    "Finance — Expense Categories",
    "Finance — Expense Records",   "Finance — Monthly Monitoring",
  ];
  const dbFields = [
    "Accounts Database",           "Income Categories Database",
    "Income Records Database",     "Expense Categories Database",
    "Expense Records Database",    "Monthly Monitoring Database",
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="max-w-2xl space-y-5">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-900">Notion is your source of truth</p>
            <p className="text-sm text-amber-800 mt-0.5">
              Review changes carefully before syncing. Destructive updates pushed to Notion cannot be undone automatically.
            </p>
          </div>
        </div>

        {/* Connection */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-foreground">Notion Integration</p>
              <p className="text-sm text-muted-foreground mt-0.5">Connect using your Notion integration token</p>
            </div>
            <Badge variant="success"><CheckCircle size={11} />Connected</Badge>
          </div>
          <Field label="Integration Token">
            <div className="relative">
              <Input type={showToken ? "text" : "password"}
                defaultValue="secret_••••••••••••••••••••••••••••••••••••••••••••"
                className="pr-20 font-mono text-xs" />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                <button type="button" onClick={() => setShowToken(!showToken)}
                  className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                  {showToken ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
                <button type="button" className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                  <Copy size={13} />
                </button>
              </div>
            </div>
          </Field>
          <div className="flex items-center gap-3">
            <button onClick={() => { setTestState("testing"); setTimeout(() => setTestState("success"), 1500); }}
              disabled={testState === "testing"}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-border bg-muted hover:bg-secondary transition-colors disabled:opacity-60">
              {testState === "testing" ? <RefreshCw size={13} className="animate-spin" /> : <Activity size={13} />}
              {testState === "testing" ? "Testing…" : "Test Connection"}
            </button>
            {testState === "success" && (
              <div className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
                <CheckCircle size={14} />Connection successful
              </div>
            )}
            {testState === "error" && (
              <div className="flex items-center gap-1.5 text-sm text-red-600">
                <AlertCircle size={14} />Failed — check your token
              </div>
            )}
          </div>
        </div>

        {/* DB mapping */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div>
            <p className="font-semibold text-foreground">Database Mapping</p>
            <p className="text-sm text-muted-foreground mt-0.5">Map each section to its Notion database</p>
          </div>
          {dbFields.map((label, i) => (
            <Field key={label} label={label}>
              <Select defaultValue={dbOptions[i]}>
                <option value="">— Not mapped —</option>
                {dbOptions.map(db => <option key={db} value={db}>{db}</option>)}
              </Select>
            </Field>
          ))}
        </div>

        <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium text-white hover:opacity-90 transition-all"
          style={{ backgroundColor: accent }}>
          {saved ? <Check size={14} /> : <Save size={14} />}
          {saved ? "Settings Saved!" : "Save Settings"}
        </button>
      </div>
    </div>
  );
}

// ─── Appearance Page ──────────────────────────────────────────────────────────

function AppearancePage({ accent, onAccentChange, colorMode, onColorModeChange }: {
  accent: string; onAccentChange: (c: string) => void;
  colorMode: ColorMode; onColorModeChange: (m: ColorMode) => void;
}) {
  const [compact, setCompact] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <div className="flex-1 overflow-y-auto p-6" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="max-w-2xl space-y-5">
        {/* Color mode */}
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="font-semibold text-foreground mb-1">Color Mode</p>
          <p className="text-sm text-muted-foreground mb-4">Choose how Notable Finance appears on your device</p>
          <div className="grid grid-cols-3 gap-3">
            {([
              { value:"light",  label:"Light",  Icon:Sun },
              { value:"dark",   label:"Dark",   Icon:Moon },
              { value:"system", label:"System", Icon:Monitor },
            ] as const).map(({ value, label, Icon }) => (
              <button key={value} onClick={() => onColorModeChange(value)}
                className={cn("flex flex-col items-center gap-2.5 p-4 rounded-xl border-2 transition-all",
                  colorMode === value ? "" : "border-border hover:border-muted-foreground/30"
                )}
                style={colorMode === value ? { borderColor: accent, backgroundColor: accent + "09" } : {}}>
                <Icon size={20} style={{ color: colorMode === value ? accent : "var(--muted-foreground)" }} />
                <span className={cn("text-sm font-medium", colorMode === value ? "text-foreground" : "text-muted-foreground")}>
                  {label}
                </span>
                {colorMode === value && (
                  <div className="w-4 h-4 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: accent }}>
                    <Check size={9} />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Accent color */}
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="font-semibold text-foreground mb-1">Accent Color</p>
          <p className="text-sm text-muted-foreground mb-4">Changes buttons, highlights, and interactive elements across the app</p>
          <div className="grid grid-cols-4 gap-3 mb-5">
            {ACCENT_PRESETS.map(({ name, color }) => (
              <button key={color} onClick={() => onAccentChange(color)}
                className={cn("flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all",
                  accent === color ? "" : "border-transparent hover:border-border"
                )}
                style={accent === color ? { borderColor: color } : {}}>
                <div className="w-8 h-8 rounded-full shadow-sm" style={{ backgroundColor: color }} />
                <span className="text-xs text-muted-foreground">{name}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-foreground">Custom:</label>
            <input type="color" value={accent} onChange={e => onAccentChange(e.target.value)}
              className="w-10 h-8 rounded cursor-pointer border border-border" />
            <span className="text-sm font-mono text-muted-foreground">{accent}</span>
          </div>
        </div>

        {/* Density */}
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="font-semibold text-foreground mb-1">Layout Density</p>
          <p className="text-sm text-muted-foreground mb-4">Control how compact the interface feels</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label:"Comfortable", desc:"More breathing room between elements", value:false },
              { label:"Compact",     desc:"More content visible at once",         value:true },
            ].map(opt => (
              <button key={opt.label} onClick={() => setCompact(opt.value)}
                className={cn("p-4 rounded-xl border-2 text-left transition-all",
                  compact === opt.value ? "" : "border-border hover:border-muted-foreground/30"
                )}
                style={compact === opt.value ? { borderColor: accent, backgroundColor: accent + "09" } : {}}>
                <p className="text-sm font-medium text-foreground">{opt.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                {compact === opt.value && (
                  <div className="mt-2.5 w-4 h-4 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: accent }}>
                    <Check size={9} />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Live preview */}
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="font-semibold text-foreground mb-4">Live Preview</p>
          <div className="rounded-xl overflow-hidden border-2" style={{ borderColor: accent + "40" }}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border"
              style={{ backgroundColor: accent + "09" }}>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded flex items-center justify-center text-white text-[9px] font-bold"
                  style={{ backgroundColor: accent }}>N</div>
                <span className="text-xs font-semibold text-foreground">Notable Finance</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-white px-2.5 py-1 rounded-lg"
                style={{ backgroundColor: accent }}>
                <RefreshCw size={9} />Sync
              </div>
            </div>
            <div className="p-4 grid grid-cols-2 gap-2 bg-background">
              <div className="bg-card rounded-lg p-3 border border-border">
                <p className="text-[9px] text-muted-foreground mb-1 uppercase tracking-wide">Net Income</p>
                <p className="text-sm font-semibold font-mono">₱92,500.00</p>
              </div>
              <div className="rounded-lg p-3 border" style={{ backgroundColor: accent + "0E", borderColor: accent + "30" }}>
                <p className="text-[9px] font-medium mb-1 uppercase tracking-wide" style={{ color: accent }}>Remaining</p>
                <p className="text-sm font-semibold font-mono">₱61,284.33</p>
              </div>
            </div>
            <div className="px-4 pb-4 bg-background">
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full w-[38%]" style={{ backgroundColor: accent }} />
              </div>
              <p className="text-[9px] text-muted-foreground mt-1.5">38% of monthly budget used · July 2025</p>
            </div>
          </div>
        </div>

        <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium text-white hover:opacity-90 transition-all"
          style={{ backgroundColor: accent }}>
          {saved ? <Check size={14} /> : <Save size={14} />}
          {saved ? "Appearance Saved!" : "Save Appearance"}
        </button>
      </div>
    </div>
  );
}

// ─── App Shell ────────────────────────────────────────────────────────────────

function AppShell({ accent, onAccentChange, colorMode, onColorModeChange, onSignOut }: {
  accent: string; onAccentChange: (c: string) => void;
  colorMode: ColorMode; onColorModeChange: (m: ColorMode) => void;
  onSignOut: () => void;
}) {
  const [page, setPage]               = useState<Page>("dashboard");
  const [syncState, setSyncState]     = useState<SyncState>("idle");
  const [selectedMonth, setMonth]     = useState(6); // July

  const handleSync = () => {
    setSyncState("syncing");
    setTimeout(() => setSyncState("success"), 2000);
    setTimeout(() => setSyncState("idle"), 6000);
  };

  const renderPage = () => {
    switch (page) {
      case "dashboard":   return <DashboardPage accent={accent} selectedMonth={selectedMonth} />;
      case "accounts":    return <AccountsPage  accent={accent} />;
      case "income":      return <IncomePage    accent={accent} selectedMonth={selectedMonth} />;
      case "expenses":    return <ExpensesPage  accent={accent} />;
      case "monthly":     return <MonthlyPage   accent={accent} selectedMonth={selectedMonth} />;
      case "sync":        return <SyncCenterPage accent={accent} syncState={syncState} onSync={handleSync} />;
      case "notion":      return <NotionSettingsPage accent={accent} />;
      case "appearance":  return <AppearancePage accent={accent} onAccentChange={onAccentChange} colorMode={colorMode} onColorModeChange={onColorModeChange} />;
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar activePage={page} onPageChange={setPage} accent={accent} onSignOut={onSignOut} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          title={PAGE_TITLES[page]}
          activePage={page}
          accent={accent}
          syncState={syncState}
          onSync={handleSync}
          selectedMonth={selectedMonth}
          onMonthChange={setMonth}
        />
        <div className="flex-1 overflow-hidden flex flex-col">
          {renderPage()}
        </div>
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen]       = useState<Screen>("landing");
  const [authView, setAuthView]   = useState<AuthView>("signin");
  const [accent, setAccent]       = useState("#5B6CF9");
  const [colorMode, setColorMode] = useState<ColorMode>("light");

  return (
    <div className="size-full" style={{ fontFamily: "'Inter', sans-serif" }}>
      {screen === "landing" && (
        <LandingPage
          accent={accent}
          onGetStarted={() => { setAuthView("signup"); setScreen("auth"); }}
          onSignIn={() => { setAuthView("signin"); setScreen("auth"); }}
        />
      )}
      {screen === "auth" && (
        <AuthPage
          view={authView}
          onViewChange={setAuthView}
          onSignIn={() => setScreen("app")}
          accent={accent}
        />
      )}
      {screen === "app" && (
        <AppShell
          accent={accent}
          onAccentChange={setAccent}
          colorMode={colorMode}
          onColorModeChange={setColorMode}
          onSignOut={() => setScreen("landing")}
        />
      )}
    </div>
  );
}

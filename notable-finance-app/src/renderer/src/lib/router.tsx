// Minimal hash router shim replacing next/link + next/navigation for the desktop renderer.
// Routes mirror the web app's /{section} paths (e.g. #/expense). Ported components keep
// their `<Link href="/x">` and `useRouter().push("/x")` call sites unchanged.
// With in-window tabs, navigate() updates the *active* tab's section via a listener.
import { useEffect, useState, type AnchorHTMLAttributes, type ReactNode } from "react";
import type { FinanceSectionId } from "@/types/finance";

const VALID_SECTIONS: FinanceSectionId[] = [
  "dashboard", "accounts", "income", "expense", "monthly-monitoring",
  "transfer", "credit-card-payment", "alkansya", "receivables", "history", "sync", "settings",
];

export function parseSection(hrefOrHash: string): FinanceSectionId {
  const raw = hrefOrHash.replace(/^#\/?/, "").replace(/^\/+/, "").split("?")[0] ?? "";
  return (VALID_SECTIONS as string[]).includes(raw) ? (raw as FinanceSectionId) : "dashboard";
}

export function currentSection(): FinanceSectionId {
  return parseSection(window.location.hash);
}

type NavigateListener = (section: FinanceSectionId) => void;
let navigateListener: NavigateListener | null = null;

/** Registered by AppTabsProvider so Link/navigate update the active tab. */
export function setNavigateListener(listener: NavigateListener | null): void {
  navigateListener = listener;
}

/** Keep location.hash in sync without stacking duplicate history entries. */
export function syncHashToSection(section: FinanceSectionId): void {
  const next = `#/${section}`;
  if (window.location.hash === next) return;
  const url = `${window.location.pathname}${window.location.search}${next}`;
  window.history.replaceState(null, "", url);
}

export function navigate(href: string): void {
  const section = parseSection(href);
  navigateListener?.(section);
  syncHashToSection(section);
}

/** Re-renders when the hash section changes (fallback when tabs provider is absent). */
export function useSection(): FinanceSectionId {
  const [section, setSection] = useState<FinanceSectionId>(currentSection());
  useEffect(() => {
    const onChange = () => setSection(currentSection());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return section;
}

interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  href: string;
  children: ReactNode;
}

export default function Link({ href, children, onClick, ...rest }: LinkProps) {
  return (
    <a
      href={`#/${href.replace(/^\/+/, "")}`}
      onClick={(e) => {
        // Keep SPA behavior: update active tab via navigate(), avoid full reload quirks.
        e.preventDefault();
        navigate(href);
        onClick?.(e);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}

export { Link };

export function useRouter() {
  return {
    push: navigate,
    replace: navigate,
    back: () => window.history.back(),
  };
}

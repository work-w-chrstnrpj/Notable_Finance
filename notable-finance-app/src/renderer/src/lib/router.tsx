// Minimal hash router shim replacing next/link + next/navigation for the desktop renderer.
// Routes mirror the web app's /{section} paths (e.g. #/expense). Ported components keep
// their `<Link href="/x">` and `useRouter().push("/x")` call sites unchanged.
import { useEffect, useState, type AnchorHTMLAttributes, type ReactNode } from "react";
import type { FinanceSectionId } from "@/types/finance";

const VALID_SECTIONS: FinanceSectionId[] = [
  "dashboard", "accounts", "income", "expense", "monthly-monitoring",
  "transfer", "credit-card-payment", "alkansya", "receivables", "sync", "settings",
];

export function currentSection(): FinanceSectionId {
  const raw = window.location.hash.replace(/^#\/?/, "").split("?")[0];
  return (VALID_SECTIONS as string[]).includes(raw) ? (raw as FinanceSectionId) : "dashboard";
}

export function navigate(href: string): void {
  window.location.hash = `#/${href.replace(/^\/+/, "")}`;
}

/** Re-renders when the hash section changes. */
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

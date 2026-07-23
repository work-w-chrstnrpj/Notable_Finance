import type { DevLogKind } from "../../../shared/finance.types";

/** Fire-and-forget renderer → main Dev Mode log (no-ops when Dev Mode is off). */
export function logDevEvent(input: {
  kind: DevLogKind;
  action: string;
  message: string;
  detail?: Record<string, unknown> | null;
  ok?: boolean | null;
}): void {
  const api = window.api?.devLogs;
  if (!api?.append) return;
  void api.append(input).catch(() => {
    /* ignore */
  });
}

export function describeClickTarget(el: Element): {
  action: string;
  message: string;
  detail: Record<string, unknown>;
} {
  const tag = el.tagName.toLowerCase();
  const id = el.id ? `#${el.id}` : "";
  const role = el.getAttribute("role");
  const aria = el.getAttribute("aria-label");
  const nameAttr =
    el instanceof HTMLInputElement || el instanceof HTMLButtonElement
      ? el.name
      : el.getAttribute("name");
  const text =
    (aria ||
      (el instanceof HTMLElement ? el.innerText : "") ||
      el.getAttribute("title") ||
      "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 80);

  const classes =
    typeof el.className === "string"
      ? el.className
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 4)
          .join(".")
      : "";

  const action = `click:${tag}${role ? `[${role}]` : ""}`;
  const message = text
    ? `Click ${tag}${id} “${text}”`
    : `Click ${tag}${id}${classes ? `.${classes}` : ""}`;

  return {
    action,
    message,
    detail: {
      tag,
      id: el.id || null,
      role,
      name: nameAttr || null,
      className: classes || null,
      href: el instanceof HTMLAnchorElement ? el.getAttribute("href") : null,
      text: text || null,
    },
  };
}

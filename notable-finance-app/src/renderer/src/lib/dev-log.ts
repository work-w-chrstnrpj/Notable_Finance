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

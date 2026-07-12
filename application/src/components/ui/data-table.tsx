"use client";

import { useMemo, useState, isValidElement } from "react";
import type { ReactNode } from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { cx } from "@/lib/finance-helpers";

/** Pull a comparable value out of a table cell (string, number, or element). */
function cellText(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(cellText).join("");
  if (isValidElement(node)) {
    const props = node.props as { value?: unknown; children?: ReactNode };
    if (typeof props.value === "number") return String(props.value);
    return cellText(props.children);
  }
  return "";
}

function cellSortKey(node: ReactNode): { num: number | null; text: string } {
  // MoneyValue and similar carry a numeric `value` prop — sort numerically.
  if (isValidElement(node) && typeof (node.props as { value?: unknown }).value === "number") {
    return { num: (node.props as { value: number }).value, text: "" };
  }
  const text = cellText(node).trim();
  const numeric = text.replace(/[₱,\s]/g, "");
  if (numeric && /^-?\d*\.?\d+$/.test(numeric)) {
    return { num: Number(numeric), text };
  }
  // Dates like "Jul 5, 2026".
  if (/\b\d{4}\b/.test(text)) {
    const parsed = Date.parse(text);
    if (!Number.isNaN(parsed)) return { num: parsed, text };
  }
  return { num: null, text: text.toLowerCase() };
}

function DataTable({
  headers,
  rows,
  footerRows = [],
  onRowClick,
  unsortableColumns = [],
  wide = false,
}: {
  headers: string[];
  rows: ReactNode[][];
  footerRows?: ReactNode[][];
  onRowClick?: (rowIndex: number) => void;
  /** Column indices that should not be clickable/sortable (e.g. icon columns). */
  unsortableColumns?: number[];
  /** Size the table to its content and let the wrapper scroll horizontally. */
  wide?: boolean;
}) {
  const [sort, setSort] = useState<{ col: number; dir: "asc" | "desc" } | null>(null);
  const skip = new Set(unsortableColumns);

  function toggleSort(col: number) {
    setSort((prev) => {
      if (!prev || prev.col !== col) return { col, dir: "asc" };
      if (prev.dir === "asc") return { col, dir: "desc" };
      return null; // third click restores original order
    });
  }

  // Keep original indices so row clicks still map to the right record.
  const ordered = useMemo(() => {
    const indexed = rows.map((row, index) => ({ row, index }));
    if (!sort) return indexed;
    const { col, dir } = sort;
    return [...indexed].sort((a, b) => {
      const ka = cellSortKey(a.row[col]);
      const kb = cellSortKey(b.row[col]);
      let cmp: number;
      if (ka.num !== null && kb.num !== null) cmp = ka.num - kb.num;
      else cmp = ka.text.localeCompare(kb.text);
      return dir === "asc" ? cmp : -cmp;
    });
  }, [rows, sort]);

  return (
    <div className="table-wrap">
      <table className={cx(wide && "data-table--wide")}>
        <thead>
          <tr>
            {headers.map((header, columnIndex) => {
              const sortable = !skip.has(columnIndex);
              const active = sort?.col === columnIndex;
              return (
                <th
                  key={header}
                  aria-sort={
                    active ? (sort?.dir === "asc" ? "ascending" : "descending") : "none"
                  }
                >
                  {sortable ? (
                    <button
                      type="button"
                      className={cx("th-sort", active && "th-sort--active")}
                      onClick={() => toggleSort(columnIndex)}
                    >
                      {header}
                      <span className="th-sort__icon">
                        {active ? (
                          sort?.dir === "asc" ? (
                            <ChevronUp size={13} />
                          ) : (
                            <ChevronDown size={13} />
                          )
                        ) : (
                          <ChevronsUpDown size={13} />
                        )}
                      </span>
                    </button>
                  ) : (
                    header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {ordered.map(({ row, index }) => (
            <tr
              key={`row-${index}`}
              className={cx(onRowClick && "table-row--clickable")}
              tabIndex={onRowClick ? 0 : undefined}
              onClick={() => onRowClick?.(index)}
              onKeyDown={(event) => {
                if (!onRowClick) {
                  return;
                }

                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onRowClick(index);
                }
              }}
            >
              {row.map((cell, cellIndex) => (
                <td key={`cell-${index}-${cellIndex}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
        {footerRows.length > 0 && (
          <tfoot>
            {footerRows.map((row, rowIndex) => (
              <tr key={`footer-${rowIndex}`}>
                {row.map((cell, cellIndex) => (
                  <td key={`footer-cell-${rowIndex}-${cellIndex}`}>{cell}</td>
                ))}
              </tr>
            ))}
          </tfoot>
        )}
      </table>
    </div>
  );
}

export { cellText, cellSortKey, DataTable };

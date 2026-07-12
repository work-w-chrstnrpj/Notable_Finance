"use client";

import { useMemo, useState, isValidElement } from "react";
import type { ReactNode } from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown, ChevronLeft, ChevronRight } from "lucide-react";
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
  pageSize = 0,
  pageSizeOptions = [10, 25, 50, 100],
  pageSummary,
}: {
  headers: string[];
  rows: ReactNode[][];
  footerRows?: ReactNode[][];
  onRowClick?: (rowIndex: number) => void;
  /** Column indices that should not be clickable/sortable (e.g. icon columns). */
  unsortableColumns?: number[];
  /** Size the table to its content and let the wrapper scroll horizontally. */
  wide?: boolean;
  /** Rows per page. 0 = no pagination (default, backward-compatible). */
  pageSize?: number;
  /** Available page-size options when pagination is active. */
  pageSizeOptions?: number[];
  /** Optional summary text shown beside the pagination controls (e.g. "325 records"). */
  pageSummary?: string;
}) {
  const [sort, setSort] = useState<{ col: number; dir: "asc" | "desc" } | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [activePageSize, setActivePageSize] = useState(pageSize);
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

  // Pagination
  const paginationActive = activePageSize > 0;
  const totalPages = paginationActive ? Math.max(1, Math.ceil(ordered.length / activePageSize)) : 1;
  // Clamp current page when total pages shrinks (e.g. after filter change).
  const safePage = Math.min(currentPage, totalPages - 1);
  const paginated = paginationActive
    ? ordered.slice(safePage * activePageSize, (safePage + 1) * activePageSize)
    : ordered;

  // Reset to first page when sort or rows change.
  const prevRowCount = rows.length;
  if (paginationActive && currentPage > 0 && rows.length !== prevRowCount) {
    setCurrentPage(0);
  }

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
          {paginated.map(({ row, index }) => (
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

      {paginationActive && (
        <div className="table-pagination">
          <div className="table-pagination__info">
            {pageSummary ?? `${ordered.length} records`}
          </div>
          <div className="table-pagination__controls">
            <select
              value={activePageSize}
              onChange={(e) => {
                setActivePageSize(Number(e.target.value));
                setCurrentPage(0);
              }}
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size} / page
                </option>
              ))}
            </select>
            <button
              type="button"
              className="table-pagination__btn"
              disabled={safePage === 0}
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            >
              <ChevronLeft size={14} />
            </button>
            {/* Show at most 5 page buttons with ellipsis */}
            {buildPageButtons(totalPages, safePage, setCurrentPage)}
            <button
              type="button"
              className="table-pagination__btn"
              disabled={safePage >= totalPages - 1}
              onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Build a compact set of page buttons with "..." ellipsis. */
function buildPageButtons(
  totalPages: number,
  current: number,
  setCurrent: (fn: (p: number) => number) => void,
) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => (
      <button
        key={i}
        type="button"
        className={cx("table-pagination__btn", i === current && "table-pagination__btn--active")}
        onClick={() => setCurrent(() => i)}
      >
        {i + 1}
      </button>
    ));
  }

  const pages: ReactNode[] = [];
  const add = (v: number) =>
    pages.push(
      <button
        key={v}
        type="button"
        className={cx("table-pagination__btn", v === current && "table-pagination__btn--active")}
        onClick={() => setCurrent(() => v)}
      >
        {v + 1}
      </button>,
    );
  const addEllipsis = (key: string) =>
    pages.push(
      <span key={key} className="table-pagination__btn" style={{ border: "none", background: "none", cursor: "default" }}>
        …
      </span>,
    );

  add(0);
  if (current > 2) addEllipsis("start");
  for (let i = Math.max(1, current - 1); i <= Math.min(totalPages - 2, current + 1); i++) {
    add(i);
  }
  if (current < totalPages - 3) addEllipsis("end");
  add(totalPages - 1);

  return pages;
}

export { cellText, cellSortKey, DataTable };


import { useMemo, useState, isValidElement } from "react";
import type { ReactNode } from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown, ChevronLeft, ChevronRight, Check, Ban, Copy, Pencil, Trash2, Minus, Printer, CreditCard } from "lucide-react";
import { cx } from "@/lib/finance-helpers";
import styles from "./data-table.module.css";

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
  wide = true,
  pageSize = 0,
  pageSizeOptions = [10, 25, 50, 100],
  pageSummary,
  rowClassName,
  selectable = false,
  selectedIds,
  disabledIds,
  onToggleSelect,
  onBulkAction,
  showBulkEdit = true,
  showBulkPrint = false,
  showBulkCover = false,
  recordIds,
  bulkDeleteLabel = "Soft Delete",
  bulkDeleteDanger = false,
}: {
  headers: string[];
  rows: ReactNode[][];
  footerRows?: ReactNode[][];
  onRowClick?: (recordId: string) => void;
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
  /** Optional callback to apply a className to each row based on its index or content. */
  rowClassName?: (recordId: string, row: ReactNode[]) => string | undefined;
  /** Enable Notion-style row selection checkboxes. */
  selectable?: boolean;
  /** Set of original row indices that are currently selected. */
  selectedIds?: Set<string>;
  /** Set of original row indices that are temporarily disabled (dimmed, excluded from totals). */
  disabledIds?: Set<string>;
  /** Callback when a row checkbox is toggled. Receives the original row index and new selected state. */
  onToggleSelect?: (recordId: string, selected: boolean) => void;
  /** Callback when a bulk action is triggered from the floating toolbar. */
  onBulkAction?: (action: "enable" | "disable" | "duplicate" | "delete" | "edit" | "print" | "cover") => void;
  /** Show the mass-edit button in the bulk toolbar (Income/Expense). */
  showBulkEdit?: boolean;
  /** Show the Print Receipt button in the bulk toolbar (Expense). */
  /** Array of record IDs, parallel to `rows`. Used for ID-based selection/disable. */
  recordIds?: string[];
  showBulkPrint?: boolean;
  /** Show the "Cover the expense" button in the bulk toolbar (Unpaid CC view). */
  showBulkCover?: boolean;
  /** Soft Delete / Hard Delete label for the selection toolbar. */
  bulkDeleteLabel?: string;
  /** Red danger styling when hard-delete mode is on. */
  bulkDeleteDanger?: boolean;
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

  // Check if any rows are selected (for bulk toolbar visibility)
  const hasSelection = selectable && (selectedIds?.size ?? 0) > 0;

  // Check if all visible (paginated) rows are selected
  const allVisibleSelected =
    selectable && recordIds &&
    paginated.length > 0 &&
    paginated.every(({ index }) => selectedIds?.has(recordIds[index]));

  // Indeterminate: some but not all visible rows are selected
  const someVisibleSelected =
    selectable && recordIds &&
    !allVisibleSelected &&
    paginated.some(({ index }) => selectedIds?.has(recordIds[index]));

  // Determine if we should show "Enable" or "Disable" in the toolbar
  const selectedHasDisabled =
    selectable &&
    (selectedIds?.size ?? 0) > 0 &&
    Array.from(selectedIds!).some((id) => disabledIds?.has(id));

  return (
    <div className={styles["table-container"]}>
      {hasSelection && (
        <div className={styles["bulk-toolbar"]}>
          <span className={styles["bulk-toolbar__count"]}>
            {selectedIds!.size} selected
          </span>
          <div className={styles["bulk-toolbar__divider"]} />
          <button
            type="button"
            className={styles["bulk-toolbar__btn"]}
            onClick={() => onBulkAction?.(selectedHasDisabled ? "enable" : "disable")}
          >
            <Ban size={14} />
            <span>{selectedHasDisabled ? "Enable" : "Disable"}</span>
          </button>
          {showBulkEdit && (
            <button
              type="button"
              className={styles["bulk-toolbar__btn"]}
              onClick={() => onBulkAction?.("edit")}
            >
              <Pencil size={14} />
              <span>Edit</span>
            </button>
          )}
          {showBulkPrint && (
            <button
              type="button"
              className={styles["bulk-toolbar__btn"]}
              onClick={() => onBulkAction?.("print")}
            >
              <Printer size={14} />
              <span>Print Receipt</span>
            </button>
          )}
          {showBulkCover && (
            <button
              type="button"
              className={styles["bulk-toolbar__btn"]}
              onClick={() => onBulkAction?.("cover")}
            >
              <CreditCard size={14} />
              <span>Cover the expense</span>
            </button>
          )}
          <button
            type="button"
            className={styles["bulk-toolbar__btn"]}
            onClick={() => onBulkAction?.("duplicate")}
          >
            <Copy size={14} />
            <span>Duplicate</span>
          </button>
          <button
            type="button"
            className={cx(
              styles["bulk-toolbar__btn"],
              bulkDeleteDanger ? styles["bulk-toolbar__btn--danger"] : undefined,
            )}
            onClick={() => onBulkAction?.("delete")}
          >
            <Trash2 size={14} />
            <span>{bulkDeleteLabel}</span>
          </button>
        </div>
      )}
      <div className={styles["table-wrap"]}>
        <table className={cx(wide && styles["data-table--wide"])}>
        <thead>
          <tr>
            {headers.map((header, columnIndex) => {
              const sortable = !skip.has(columnIndex);
              const active = sort?.col === columnIndex;
              const isFirstColumn = selectable && columnIndex === 0;
              return (
                <th
                  key={header}
                  className={cx(isFirstColumn && styles["th-checkbox"])}
                  aria-sort={
                    active ? (sort?.dir === "asc" ? "ascending" : "descending") : "none"
                  }
                >
                  {isFirstColumn && (
                    <button
                      type="button"
                      className={cx(
                        styles["row-checkbox"], styles["row-checkbox--header"],
                        allVisibleSelected && styles["row-checkbox--checked"],
                        someVisibleSelected && styles["row-checkbox--indeterminate"],
                      )}
                      aria-label="Select all rows"
                      onClick={() => {
                        if (!onToggleSelect || !recordIds) return;
                        const visibleIds = paginated.map(({ index }) => recordIds[index]).filter(Boolean);
                        if (allVisibleSelected) {
                          for (const id of visibleIds) {
                            onToggleSelect(id, false);
                          }
                        } else {
                          for (const id of visibleIds) {
                            onToggleSelect(id, true);
                          }
                        }
                      }}
                    >
                      <span className={styles["row-checkbox__box"]}>
                        {someVisibleSelected ? (
                          <Minus size={12} strokeWidth={3} />
                        ) : (
                          <Check size={12} strokeWidth={3} />
                        )}
                      </span>
                    </button>
                  )}
                  {sortable ? (
                    <button
                      type="button"
                      className={cx(styles["th-sort"], active && styles["th-sort--active"])}
                      onClick={() => toggleSort(columnIndex)}
                    >
                      {header}
                      <span className={styles["th-sort__icon"]}>
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
          {paginated.map(({ row, index }) => {
            const isSelected = (recordIds && selectedIds?.has(recordIds[index])) ?? false;
            return (
              <tr
                key={`row-${index}`}
                className={cx(
                  onRowClick && styles["table-row--clickable"],
                  selectable && recordIds && selectedIds?.has(recordIds[index]) && styles["table-row--selected"],
                  selectable && recordIds && disabledIds?.has(recordIds[index]) && styles["record-disabled"],
                  rowClassName?.(recordIds?.[index] ?? "", row),
                )}
                tabIndex={onRowClick ? 0 : undefined}
                onClick={() => {
                          const id = recordIds?.[index];
                          if (id) onRowClick?.(id);
                        }}
                onKeyDown={(event) => {
                  if (!onRowClick || !recordIds) {
                    return;
                  }

                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    const id = recordIds[index];
                    if (id) onRowClick(id);
                  }
                }}
              >
                {row.map((cell, cellIndex) => (
                  <td
                    key={`cell-${index}-${cellIndex}`}
                    className={cx(selectable && cellIndex === 0 && styles["td-checkbox"])}
                  >
                    {selectable && cellIndex === 0 && (
                      <button
                        type="button"
                        className={cx(styles["row-checkbox"], isSelected && styles["row-checkbox--checked"])}
                        aria-label="Select row"
                        onClick={(event) => {
                          event.stopPropagation();
                          const id = recordIds?.[index];
                          if (id) onToggleSelect?.(id, !isSelected);
                        }}
                      >
                        <span className={styles["row-checkbox__box"]}>
                          <Check size={12} strokeWidth={3} />
                        </span>
                      </button>
                    )}
                    {cell}
                  </td>
                ))}
              </tr>
            );
          })}
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
        <div className={styles["table-pagination"]}>
          <div className={styles["table-pagination__info"]}>
            {pageSummary ?? `${ordered.length} records`}
          </div>
          <div className={styles["table-pagination__controls"]}>
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
              className={styles["table-pagination__btn"]}
              disabled={safePage === 0}
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            >
              <ChevronLeft size={14} />
            </button>
            {/* Show at most 5 page buttons with ellipsis */}
            {buildPageButtons(totalPages, safePage, setCurrentPage)}
            <button
              type="button"
              className={styles["table-pagination__btn"]}
              disabled={safePage >= totalPages - 1}
              onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
      </div>
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
        className={cx(styles["table-pagination__btn"], i === current && styles["table-pagination__btn--active"])}
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
        className={cx(styles["table-pagination__btn"], v === current && styles["table-pagination__btn--active"])}
        onClick={() => setCurrent(() => v)}
      >
        {v + 1}
      </button>,
    );
  const addEllipsis = (key: string) =>
    pages.push(
      <span key={key} className={styles["table-pagination__btn"]} style={{ border: "none", background: "none", cursor: "default" }}>
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

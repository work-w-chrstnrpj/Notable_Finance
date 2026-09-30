
import { useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, FileWarning, Gauge, RefreshCw } from "lucide-react";
import { cx } from "@/lib/finance-helpers";
import { rangeLabel, stepAnchor, type ViewUnit } from "@/lib/date-range";
import type { SchemaHealth, SyncState } from "@/types/finance";

const PICKER_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function DateRangeSelector({
  unit,
  anchorDate,
  onChange,
  activeMonths,
}: {
  unit: ViewUnit;
  anchorDate: string;
  onChange: (isoDate: string) => void;
  activeMonths?: number[];
}) {
  const [open, setOpen] = useState(false);
  const [year, month] = anchorDate.split("-").map(Number);
  const [draftYear, setDraftYear] = useState(year);
  const [draftMonth, setDraftMonth] = useState(month - 1);

  function toggleOpen() {
    setOpen((v) => {
      const next = !v;
      if (next) { setDraftYear(year); setDraftMonth(month - 1); } // sync draft to current anchor on open
      return next;
    });
  }

  const label = rangeLabel(unit, anchorDate);
  const showDayPicker = unit === "day" || unit === "week";
  const showMonthGrid = unit === "month";

  function pickMonth(m: number) {
    // Keep the day when possible; clamp to the 1st for month/year scopes.
    const targetDay = 1;
    onChange(
      `${draftYear.toString().padStart(4, "0")}-${(m + 1)
        .toString()
        .padStart(2, "0")}-${targetDay.toString().padStart(2, "0")}`,
    );
    if (!showDayPicker) setOpen(false);
  }

  return (
    <div className="month-stepper" onKeyDown={e => { if (e.key === "Escape") setOpen(false); }}>
      <button
        type="button"
        aria-label="Previous"
        onClick={() => onChange(stepAnchor(unit, anchorDate, -1))}
      >
        <ChevronLeft size={13} />
      </button>
      <button
        type="button"
        className="month-stepper__label"
        onClick={toggleOpen}
        aria-expanded={open}
      >
        {label}
      </button>
      <button
        type="button"
        aria-label="Next"
        onClick={() => onChange(stepAnchor(unit, anchorDate, 1))}
      >
        <ChevronRight size={13} />
      </button>

      {open && (
        <>
          <div
            className="date-picker__backdrop"
            role="presentation"
            onClick={() => setOpen(false)}
          />
          <div className="date-picker" role="dialog" aria-label="Pick a date">
            {showDayPicker ? (
              <>
                <div className="date-picker__year-row">
                  <button type="button" aria-label="Previous month" onClick={() => {
                    const date = new Date(draftYear, draftMonth - 1, 1);
                    setDraftYear(date.getFullYear()); setDraftMonth(date.getMonth());
                  }}><ChevronLeft size={14} /></button>
                  <strong>{PICKER_MONTHS[draftMonth]} {draftYear}</strong>
                  <button type="button" aria-label="Next month" onClick={() => {
                    const date = new Date(draftYear, draftMonth + 1, 1);
                    setDraftYear(date.getFullYear()); setDraftMonth(date.getMonth());
                  }}><ChevronRight size={14} /></button>
                </div>
                <div className="date-picker__day-grid">
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => <span key={d}>{d}</span>)}
                  {Array.from({ length: new Date(draftYear, draftMonth, 1).getDay() }, (_, i) => <span key={`blank-${i}`} />)}
                  {Array.from({ length: new Date(draftYear, draftMonth + 1, 0).getDate() }, (_, i) => {
                    const iso = `${draftYear}-${String(draftMonth + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
                    return <button type="button" key={iso} aria-label={iso} aria-pressed={iso === anchorDate}
                      className={cx("date-picker__cell", iso === anchorDate && "is-active")}
                      onClick={() => { onChange(iso); setOpen(false); }}>{i + 1}</button>;
                  })}
                </div>
              </>
            ) : unit === "year" ? (
              <div className="date-picker__year-list">
                {Array.from({ length: 9 }, (_, i) => year - 4 + i).map((y) => (
                  <button
                    type="button"
                    key={y}
                    className={cx("date-picker__cell", y === year && "is-active")}
                    onClick={() => {
                      onChange(`${y}-01-01`);
                      setOpen(false);
                    }}
                  >
                    {y}
                  </button>
                ))}
              </div>
            ) : (
              <>
                <div className="date-picker__year-row">
                  <button type="button" onClick={() => setDraftYear((y) => y - 1)}>
                    <ChevronLeft size={14} />
                  </button>
                  <strong>{draftYear}</strong>
                  <button type="button" onClick={() => setDraftYear((y) => y + 1)}>
                    <ChevronRight size={14} />
                  </button>
                </div>
                {showMonthGrid && (
                  <div className="date-picker__month-grid">
                    {PICKER_MONTHS.map((mName, m) => (
                      <button
                        type="button"
                        key={mName}
                        className={cx(
                          "date-picker__cell",
                          draftYear === year && (m + 1 === month || activeMonths?.includes(m)) && "is-active",
                        )}
                        onClick={() => pickMonth(m)}
                      >
                        {mName}
                      </button>
                    ))}
                  </div>
                )}

              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function StatusPill({
  syncState,
  schemaHealth,
}: {
  syncState: SyncState;
  schemaHealth: SchemaHealth;
}) {
  if (syncState === "syncing") {
    return (
      <span className="pill pill--info">
        <RefreshCw size={14} className="spin" />
        Syncing
      </span>
    );
  }

  if (schemaHealth === "warning") {
    return (
      <span className="pill pill--warning">
        <FileWarning size={14} />
        Schema review
      </span>
    );
  }

  if (schemaHealth === "verified" || syncState === "fresh") {
    return (
      <span className="pill pill--success">
        <CheckCircle2 size={14} />
        Fresh
      </span>
    );
  }

  return (
    <span className="pill">
      <Gauge size={14} />
      Ready
    </span>
  );
}

export { DateRangeSelector, StatusPill, PICKER_MONTHS };

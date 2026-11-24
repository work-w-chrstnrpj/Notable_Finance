import { describe, expect, it } from "vitest";
import {
  activeSelectorUnit,
  computeRange,
  expenseModeToUnit,
  halfOf,
  incomeModeToUnit,
  monitoringModeToUnit,
  periodContaining,
  periodMonthIndexes,
  quarterOf,
  rangeLabel,
  stepAnchor,
} from "./date-range";

describe("workflow date selector", () => {
  it.each(["alkansya", "receivables"] as const)("uses the selected period unit for %s", (section) => {
    expect(activeSelectorUnit(section, "Monthly", "Monthly", "Monthly", "Daily")).toBe("day");
    expect(activeSelectorUnit(section, "Monthly", "Monthly", "Monthly", "Weekly")).toBe("week");
    expect(activeSelectorUnit(section, "Monthly", "Monthly", "Monthly", "Monthly")).toBe("month");
    expect(activeSelectorUnit(section, "Monthly", "Monthly", "Monthly", "Annually")).toBe("year");
    expect(activeSelectorUnit(section, "Monthly", "Monthly", "Monthly", "All Records")).toBeNull();
  });

  it("hides the date selector for All Records in Income and Expense", () => {
    expect(activeSelectorUnit("income", "All Records", "Monthly")).toBeNull();
    expect(activeSelectorUnit("expense", "Monthly", "All Records")).toBeNull();
  });
});

describe("calendar-periods/01 fixed quarters and halves", () => {
  it("calendar-periods/01#AC1 November 2026 gives Oct 1 to Dec 31 for Quarterly and Jul 1 to Dec 31 for Semi-Annually", () => {
    expect(computeRange("quarter", "2026-11-15")).toEqual({ start: "2026-10-01", end: "2026-12-31" });
    expect(computeRange("half", "2026-11-15")).toEqual({ start: "2026-07-01", end: "2026-12-31" });
    expect(periodContaining("quarter", "2026-11-15")).toEqual({ start: "2026-10-01", end: "2026-12-31" });
  });

  it("calendar-periods/01#AC2 every month maps to its fixed quarter and half, including edge days and a leap-year February", () => {
    const quarters = [1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4];
    for (let m = 1; m <= 12; m++) {
      const mm = String(m).padStart(2, "0");
      expect(quarterOf(`2026-${mm}-01`)).toBe(quarters[m - 1]);
      expect(quarterOf(`2026-${mm}-28`)).toBe(quarters[m - 1]);
      expect(halfOf(`2026-${mm}-15`)).toBe(m <= 6 ? 1 : 2);
    }
    expect(computeRange("quarter", "2026-01-01")).toEqual({ start: "2026-01-01", end: "2026-03-31" });
    expect(computeRange("quarter", "2026-03-31")).toEqual({ start: "2026-01-01", end: "2026-03-31" });
    expect(computeRange("quarter", "2026-04-01")).toEqual({ start: "2026-04-01", end: "2026-06-30" });
    expect(computeRange("quarter", "2026-09-30")).toEqual({ start: "2026-07-01", end: "2026-09-30" });
    expect(computeRange("half", "2026-06-30")).toEqual({ start: "2026-01-01", end: "2026-06-30" });
    expect(computeRange("half", "2026-07-01")).toEqual({ start: "2026-07-01", end: "2026-12-31" });
    // leap year: Q1 and H1 of 2028 still end on Mar 31 / Jun 30, February 29 lies inside them
    expect(computeRange("quarter", "2028-02-29")).toEqual({ start: "2028-01-01", end: "2028-03-31" });
    expect(computeRange("half", "2028-02-29")).toEqual({ start: "2028-01-01", end: "2028-06-30" });
    expect(periodMonthIndexes("quarter", "2026-11-15")).toEqual([9, 10, 11]);
    expect(periodMonthIndexes("half", "2026-03-10")).toEqual([0, 1, 2, 3, 4, 5]);
    expect(periodMonthIndexes("month", "2026-03-10")).toEqual([]);
  });

  it("calendar-periods/01#AC3 stepping moves one whole quarter or half and crosses year boundaries", () => {
    expect(stepAnchor("quarter", "2026-11-15", 1)).toBe("2027-01-01");
    expect(stepAnchor("quarter", "2026-11-15", -1)).toBe("2026-07-01");
    expect(stepAnchor("quarter", "2026-01-20", -1)).toBe("2025-10-01");
    expect(stepAnchor("half", "2026-03-10", -1)).toBe("2025-07-01");
    expect(stepAnchor("half", "2026-11-30", 1)).toBe("2027-01-01");
    expect(stepAnchor("half", "2026-11-30", -1)).toBe("2026-01-01");
    // the stepped anchor always lies inside the period it names, whatever day of the month we started on
    for (const day of ["2026-05-31", "2026-08-31", "2026-12-31"]) {
      const next = stepAnchor("quarter", day, 1);
      const { start, end } = computeRange("quarter", next);
      expect(next >= start && next <= end).toBe(true);
    }
  });

  it("calendar-periods/01#AC4 the selector label reads Q4 2026 · Oct – Dec and H2 2026 · Jul – Dec, and other labels are unchanged", () => {
    expect(rangeLabel("quarter", "2026-11-15")).toBe("Q4 2026 · Oct – Dec");
    expect(rangeLabel("quarter", "2026-02-01")).toBe("Q1 2026 · Jan – Mar");
    expect(rangeLabel("half", "2026-11-15")).toBe("H2 2026 · Jul – Dec");
    expect(rangeLabel("half", "2026-06-30")).toBe("H1 2026 · Jan – Jun");
    expect(rangeLabel("day", "2026-11-05")).toBe("November 5, 2026");
    expect(rangeLabel("month", "2026-11-05")).toBe("November 2026");
    expect(rangeLabel("year", "2026-11-05")).toBe("2026");
    expect(rangeLabel("week", "2026-11-05")).toBe("Nov 2 – Nov 8, 2026");
  });

  it("calendar-periods/01#AC4 Income, Expense, workflow and Monitoring modes map Quarterly and Semi-Annually to the new units", () => {
    expect(incomeModeToUnit("Quarterly")).toBe("quarter");
    expect(incomeModeToUnit("Semi-Annually")).toBe("half");
    expect(expenseModeToUnit("Quarterly")).toBe("quarter");
    expect(expenseModeToUnit("Semi-Annually")).toBe("half");
    expect(expenseModeToUnit("Pasabuy")).toBeNull();
    expect(monitoringModeToUnit("Quarterly")).toBe("quarter");
    expect(monitoringModeToUnit("Semi-Annually")).toBe("half");
    expect(monitoringModeToUnit("Monthly")).toBe("month");
    expect(activeSelectorUnit("income", "Quarterly", "Monthly")).toBe("quarter");
    expect(activeSelectorUnit("expense", "Monthly", "Semi-Annually")).toBe("half");
    expect(activeSelectorUnit("monthly-monitoring", "Monthly", "Monthly", "Quarterly")).toBe("quarter");
    expect(activeSelectorUnit("transfer", "Monthly", "Monthly", "Monthly", "Semi-Annually")).toBe("half");
    expect(activeSelectorUnit("dashboard", "Quarterly", "Quarterly")).toBe("month");
  });
});

import { describe, expect, it } from "vitest";
import { activeSelectorUnit } from "./date-range";

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

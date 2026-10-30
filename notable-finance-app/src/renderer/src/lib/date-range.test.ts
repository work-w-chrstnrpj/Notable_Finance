import { describe, expect, it } from "vitest";
import { activeSelectorUnit } from "./date-range";

describe("workflow date selector", () => {
  it.each(["alkansya", "receivables"] as const)("uses the selected period unit for %s", (section) => {
    expect(activeSelectorUnit(section, "Monthly", "Monthly", "Monthly", "Daily")).toBe("day");
    expect(activeSelectorUnit(section, "Monthly", "Monthly", "Monthly", "Weekly")).toBe("week");
    expect(activeSelectorUnit(section, "Monthly", "Monthly", "Monthly", "Monthly")).toBe("month");
    expect(activeSelectorUnit(section, "Monthly", "Monthly", "Monthly", "Annually")).toBe("year");
  });
});

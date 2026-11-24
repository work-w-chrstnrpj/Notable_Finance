// @vitest-environment jsdom
// calendar-periods/01#AC5: the date selector shows the quarter and half labels and steps by whole periods.
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DateRangeSelector } from "./date-range";

describe("calendar-periods/01 date selector", () => {
  it("calendar-periods/01#AC5 shows the quarter label and steps one whole quarter with the arrows", () => {
    const onChange = vi.fn();
    render(<DateRangeSelector unit="quarter" anchorDate="2026-11-15" onChange={onChange} />);
    expect(screen.getByText("Q4 2026 · Oct – Dec")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(onChange).toHaveBeenLastCalledWith("2027-01-01");
    fireEvent.click(screen.getByRole("button", { name: "Previous" }));
    expect(onChange).toHaveBeenLastCalledWith("2026-07-01");
  });

  it("calendar-periods/01#AC5 shows the half label and steps one whole half", () => {
    const onChange = vi.fn();
    render(<DateRangeSelector unit="half" anchorDate="2026-03-10" onChange={onChange} />);
    expect(screen.getByText("H1 2026 · Jan – Jun")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(onChange).toHaveBeenLastCalledWith("2026-07-01");
  });

  it("calendar-periods/01#AC5 the month grid highlights every month of the period and picking a month selects the period containing it", () => {
    const onChange = vi.fn();
    render(<DateRangeSelector unit="quarter" anchorDate="2026-11-15" onChange={onChange} />);
    fireEvent.click(screen.getByText("Q4 2026 · Oct – Dec"));
    const active = ["Oct", "Nov", "Dec"].map((m) => screen.getByRole("button", { name: m }).className);
    expect(active.every((c) => c.includes("is-active"))).toBe(true);
    expect(screen.getByRole("button", { name: "Sep" }).className).not.toContain("is-active");
    fireEvent.click(screen.getByRole("button", { name: "Feb" }));
    expect(onChange).toHaveBeenLastCalledWith("2026-02-01");
  });
});

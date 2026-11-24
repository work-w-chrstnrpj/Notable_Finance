// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { DataTable } from "./data-table";

const store = new Map<string, string>();
const memoryStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
  clear: () => store.clear(),
  get length() { return store.size; },
};
beforeEach(() => vi.stubGlobal("localStorage", memoryStorage));
afterEach(() => { store.clear(); vi.unstubAllGlobals(); });

const headers = ["Title", "Amount"];
const rows = [["Lunch", "250"]];

describe("expense-views/03 column widths persist", () => {
  it("a resized column is saved under the table id and restored on the next open", () => {
    const first = render(<DataTable headers={headers} rows={rows} resizable tableId="expense:Monthly" />);
    const handle = screen.getByLabelText("Resize Amount column");
    fireEvent.keyDown(handle, { key: "ArrowRight" });
    const saved = JSON.parse(localStorage.getItem("nf_column_widths:expense:Monthly") ?? "{}");
    expect(saved.Amount).toBeGreaterThan(0);
    first.unmount();
    render(<DataTable headers={headers} rows={rows} resizable tableId="expense:Monthly" />);
    fireEvent.keyDown(screen.getByLabelText("Resize Amount column"), { key: "ArrowLeft" });
    const after = JSON.parse(localStorage.getItem("nf_column_widths:expense:Monthly") ?? "{}");
    expect(after.Amount).toBe(saved.Amount - 16);
  });

  it("another view keeps its own widths, and a table without an id saves nothing", () => {
    render(<DataTable headers={headers} rows={rows} resizable tableId="expense:Pasabuy" />);
    expect(localStorage.getItem("nf_column_widths:expense:Monthly")).toBeNull();
    fireEvent.keyDown(screen.getByLabelText("Resize Amount column"), { key: "ArrowRight" });
    expect(localStorage.getItem("nf_column_widths:expense:Pasabuy")).not.toBeNull();
    localStorage.clear();
    render(<DataTable headers={headers} rows={rows} resizable />);
    expect(localStorage.length).toBe(0);
  });
});

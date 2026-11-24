// @vitest-environment jsdom
// custom-budget/03#AC4: the full local reset says custom budgets stay in Notion and are refilled on the next sync.
import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, screen } from "@testing-library/react";
import { renderPage } from "../../../../../test/render-page";
import { SyncPage } from "./sync";

describe("reset local database", () => {
  it("custom-budget/03#AC4 the confirmation says custom budgets stay in Notion", async () => {
    renderPage(
      <SyncPage
        lastSync="Never"
        pendingOperations={0}
        schemaHealth="verified"
        syncState="idle"
        activeSyncKind={null}
        onSchemaVerify={vi.fn()}
        onPullSync={vi.fn()}
        onPushSync={vi.fn()}
        onSync={vi.fn()}
      />,
    );
    await screen.findByText(/Initial pull from Notion/);
    // Let the panel finish loading its settings before opening the confirmation.
    await act(async () => { await new Promise((r) => setTimeout(r, 300)); });
    fireEvent.click(await screen.findByRole("button", { name: /^Reset$/ }));
    const message = await screen.findByText(/refilled on the next sync/i, {}, { timeout: 3000 });
    expect(message).toHaveTextContent(/custom budgets/i);
  });
});

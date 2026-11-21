// @vitest-environment jsdom
// monthly-budget/05#AC4: the full local reset warns that saved budgets are deleted and should be exported first.
import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, screen } from "@testing-library/react";
import { renderPage } from "../../../../../test/render-page";
import { SyncPage } from "./sync";

describe("reset local database", () => {
  it("monthly-budget/05#AC4 the confirmation tells the user to export saved budgets first", async () => {
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
    const message = await screen.findByText(/export them first/i, {}, { timeout: 3000 });
    expect(message).toHaveTextContent(/saved budgets/i);
  });
});

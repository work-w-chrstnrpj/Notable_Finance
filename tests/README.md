# Tests

This folder is reserved for future automated and manual verification assets.

Planned coverage:

- Unit tests for mappers, validators, field access rules, and sync state handling.
- Integration tests for backend API behavior with mocked Notion responses.
- Contract tests for API request and response shapes.
- End-to-end tests for pull, create, edit, delete, and sync workflows.
- Manual test cases for a non-production Notion workspace/page.

Rules:

- Do not run destructive tests against the real finance Notion workspace.
- Verify that computed fields are hidden from forms and rejected in mutation payloads.
- Verify that income and expense delete behavior follows the title/amount mutation policy.
- Verify that sync pushes to Notion, pulls fresh data, and refreshes UI state.
- Add concrete commands after the implementation stack is selected.

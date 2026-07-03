# Shared

This folder is reserved for future cross-layer contracts and stable shared definitions.

Planned responsibilities:

- Resource names for accounts, income categories, incomes, transactions, expense categories, expenses, expense scheduler, and sync.
- API DTOs and response shapes, if shared between frontend and backend.
- Field access classifications such as writable, read-only, computed, hidden, and out of scope.
- Live Notion select label constants preserved exactly.
- Shared validation schemas where safe.
- Money, date, and display formatting helpers where reused by more than one runtime layer.

Rules:

- Keep this folder small and stable.
- Do not import frontend-only or backend-only runtime modules from shared code.
- Do not put Notion tokens, environment values, or direct Notion API clients here.
- Do not add framework-specific files until the implementation scaffolding task begins.

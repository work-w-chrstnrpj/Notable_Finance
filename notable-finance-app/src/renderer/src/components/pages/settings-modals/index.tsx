/**
 * refactor_development_plan.md Phase 6.1 — barrel for the 5 settings modals, each split into
 * its own file (pure move; no behavior change). Consumers (settings.tsx, chat.tsx) import from
 * "@/components/pages/settings-modals" unchanged.
 */
export { ProfileManageModal } from "./profile-manage-modal";
export { InterfaceManageModal } from "./interface-manage-modal";
export { ThemeCustomizeModal } from "./theme-customize-modal";
export { NotionConfigModal, KNOWN_DB_ID_KEYS } from "./notion-config-modal";
export { AiChatConfigModal } from "./ai-chat-config-modal";

type SettingsModalKind = "notion" | "theme" | "interface" | "profile" | "ai" | null;

export type { SettingsModalKind };

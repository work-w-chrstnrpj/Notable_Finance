import { useState, useEffect } from "react";
import { useUiSettings } from "@/lib/ui-settings-context";
import type { ChatCredentialDto, ChatProviderCatalogDto } from "@shared/finance.types";

/**
 * All state and handlers for the AI Chat settings modal (refactor_development_plan.md
 * Phase 6.1 — same pattern as the Phase 5 useXForm hooks). Lifted verbatim out of
 * ai-chat-config-modal.tsx; the JSX stays in the modal since none of it is reused.
 */
export function useAiChatConfig() {
  const { settings, updateSettings, setChatEnabled } = useUiSettings();
  const [credentials, setCredentials] = useState<ChatCredentialDto[]>([]);
  const [isAppleOs, setIsAppleOs] = useState(false);
  const [appleStatusLabel, setAppleStatusLabel] = useState("…");
  const [appleDetail, setAppleDetail] = useState("");
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [appleStatus, setAppleStatus] = useState<"available" | "unavailable" | "unsupported">(
    "unavailable"
  );
  const [formName, setFormName] = useState("");
  const [formKey, setFormKey] = useState("");
  const [formProvider, setFormProvider] = useState("gemini");
  const [formCustomBaseUrl, setFormCustomBaseUrl] = useState("");
  /** Provider guessed from the key prefix; only auto-applies until the user picks one. */
  const [detectedProvider, setDetectedProvider] = useState<string | null>(null);
  const [providerTouched, setProviderTouched] = useState(false);
  const [providers, setProviders] = useState<ChatProviderCatalogDto[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [appleBusy, setAppleBusy] = useState(false);

  const selectedProvider = providers.find((p) => p.id === formProvider) ?? null;

  const refresh = async () => {
    const res = await window.api.chat.listCredentials();
    if (res.ok) setCredentials(res.data);
  };

  const refreshAppleStatus = async (forceRefresh = false) => {
    setAppleBusy(true);
    try {
      const r = await window.api.chat.status({ forceRefresh });
      if (r.ok) {
        setAppleStatusLabel(r.data.appleStatusLabel);
        setAppleDetail(r.data.appleDetail);
        setAppleAvailable(r.data.appleAvailable);
        setAppleStatus(r.data.appleStatus);
      }
    } finally {
      setAppleBusy(false);
    }
  };

  useEffect(() => {
    void refresh();
    void window.api.chat.isAppleOs().then((r) => {
      if (r.ok) setIsAppleOs(r.data);
    });
    void refreshAppleStatus();
    void window.api.chat.providers?.().then((r) => {
      if (r.ok && r.data.length > 0) setProviders(r.data);
    });
  }, []);

  function resetForm() {
    setEditingId(null);
    setFormName("");
    setFormKey("");
    setFormProvider("gemini");
    setFormCustomBaseUrl("");
    setDetectedProvider(null);
    setProviderTouched(false);
  }

  /** Guess the host from the key prefix so the Name field can't mislead routing. */
  async function detectProviderFromKeyInput(key: string) {
    const trimmed = key.trim();
    if (!trimmed || !window.api?.chat?.detectProvider) return;
    const res = await window.api.chat.detectProvider(trimmed);
    if (!res.ok || !res.data) {
      setDetectedProvider(null);
      return;
    }
    setDetectedProvider(res.data);
    if (!providerTouched) setFormProvider(res.data);
  }

  function providerLabel(c: ChatCredentialDto): string {
    const id = c.providerId ?? "custom";
    return providers.find((p) => p.id === id)?.label ?? id;
  }

  async function onSaveCredential() {
    const name = (formName.trim() || selectedProvider?.label || "API key").trim();
    if (!editingId && !formKey.trim()) {
      setError("API key is required.");
      return;
    }
    if (formProvider === "custom" && !formCustomBaseUrl.trim()) {
      setError("Custom provider needs a base URL (OpenAI-compatible …/v1).");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (editingId) {
        const patch: {
          name: string;
          apiKey?: string;
          baseUrl?: string | null;
          providerId: string;
        } = {
          name,
          providerId: formProvider
        };
        if (formProvider === "custom") {
          patch.baseUrl = formCustomBaseUrl.trim().replace(/\/$/, "") || null;
        } else if (formProvider === "openai") {
          patch.baseUrl = null;
        }
        if (formKey.trim()) patch.apiKey = formKey;
        const res = await window.api.chat.updateCredential(editingId, patch);
        if (!res.ok) throw new Error(res.error.message);
      } else {
        const createOpts: { baseUrl?: string | null; providerId: string } = {
          providerId: formProvider
        };
        if (formProvider === "custom") {
          createOpts.baseUrl = formCustomBaseUrl.trim().replace(/\/$/, "") || null;
        } else if (formProvider === "openai") {
          createOpts.baseUrl = null;
        }
        const res = await window.api.chat.createCredential(name, formKey, createOpts);
        if (!res.ok) throw new Error(res.error.message);
      }
      if (selectedProvider?.defaultModelId) {
        // Only nudge the global default when saving a key that becomes/is default.
        const list = await window.api.chat.listCredentials();
        const savedDefault =
          list.ok &&
          list.data.some(
            (c) =>
              c.isDefault &&
              (c.providerId ?? "") === formProvider
          );
        if (savedDefault) {
          void updateSettings({ chatDefaultModel: selectedProvider.defaultModelId });
        }
      }
      resetForm();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save credential.");
    } finally {
      setBusy(false);
    }
  }

  async function onDeleteCredential(id: string) {
    if (!window.confirm("Remove this API key from this device?")) return;
    setBusy(true);
    try {
      const res = await window.api.chat.deleteCredential(id);
      if (!res.ok) throw new Error(res.error.message);
      if (editingId === id) resetForm();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete credential.");
    } finally {
      setBusy(false);
    }
  }

  async function onSetDefault(id: string) {
    const res = await window.api.chat.setDefaultCredential(id);
    if (res.ok) await refresh();
  }

  async function onDeleteAllChats() {
    setBusy(true);
    setError(null);
    try {
      const res = await window.api.chat.deleteAllThreads();
      if (!res.ok) throw new Error(res.error.message);
      setConfirmDeleteAll(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete conversations.");
    } finally {
      setBusy(false);
    }
  }

  return {
    settings, updateSettings, setChatEnabled,
    credentials,
    isAppleOs,
    appleStatusLabel,
    appleDetail,
    appleAvailable,
    appleStatus,
    appleBusy,
    formName, setFormName,
    formKey, setFormKey,
    formProvider, setFormProvider,
    formCustomBaseUrl, setFormCustomBaseUrl,
    detectedProvider,
    providerTouched, setProviderTouched,
    providers,
    editingId, setEditingId,
    error, setError,
    busy,
    confirmDeleteAll, setConfirmDeleteAll,
    selectedProvider,
    refreshAppleStatus,
    resetForm,
    detectProviderFromKeyInput,
    providerLabel,
    onSaveCredential,
    onDeleteCredential,
    onSetDefault,
    onDeleteAllChats,
  };
}

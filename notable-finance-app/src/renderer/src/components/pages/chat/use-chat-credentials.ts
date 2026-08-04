import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import type { ChatCredentialDto, ChatProviderCatalogDto } from "@shared/finance.types";

/** Prefer current id when still valid; else free-tier, else first, else fallback. */
function pickModelForList(
  currentId: string,
  list: Array<{ id: string; free?: boolean }>,
  fallbackId?: string,
): string {
  if (currentId && list.some((m) => m.id === currentId)) return currentId;
  const free = list.find((m) => m.free);
  return free?.id ?? list[0]?.id ?? fallbackId ?? currentId;
}

/**
 * Which API key (credential) and model are active, and keeping the model list in sync
 * as the key changes. refactor_development_plan.md Phase 6.2 — same useXForm pattern as
 * Phase 4/5, scoped to this one cohesive concern; everything else in ChatModePage stays
 * put per the plan's own caution against inventing a chat state machine.
 */
export function useChatCredentials({
  chatDefaultModel,
  activeIdRef,
  refreshThreads,
}: {
  chatDefaultModel: string;
  activeIdRef: RefObject<string | null>;
  refreshThreads: () => Promise<void>;
}) {
  const [credentials, setCredentials] = useState<ChatCredentialDto[]>([]);
  const [providers, setProviders] = useState<ChatProviderCatalogDto[]>([]);
  const [models, setModels] = useState<Array<{ id: string; label: string; free?: boolean }>>([]);
  const [credentialId, setCredentialId] = useState<string>("");
  const [modelId, setModelId] = useState<string>(chatDefaultModel || "gemini-2.5-flash");
  const [customModel, setCustomModel] = useState(false);
  const [needsKey, setNeedsKey] = useState(false);
  /** Ignore stale chat:models responses when Key changes quickly. */
  const modelsFetchGen = useRef(0);
  const modelIdRef = useRef(modelId);
  modelIdRef.current = modelId;

  const activeCredential = credentials.find((c) => c.id === credentialId) ?? null;
  const showCustom = customModel || !models.some((m) => m.id === modelId);

  const refreshCredentials = useCallback(async () => {
    const api = window.api?.chat;
    if (!api) return;
    const res = await api.listCredentials();
    if (res.ok) {
      setCredentials(res.data);
      setNeedsKey(res.data.length === 0);
      setCredentialId((prev) => {
        if (prev && res.data.some((c) => c.id === prev)) return prev;
        const def = res.data.find((c) => c.isDefault) ?? res.data[0];
        return def?.id ?? "";
      });
    }
  }, []);

  const applyModelsForCredential = useCallback(
    (credId: string, opts?: { preferModelId?: string | null; persistThreadId?: string | null }) => {
      const cred = credentials.find((c) => c.id === credId) ?? null;
      const catalog = providers.find((p) => p.id === (cred?.providerId ?? ""));
      const prefer = opts?.preferModelId ?? modelIdRef.current;

      if (catalog?.models?.length) {
        const list = catalog.models.map((m) => ({
          id: m.id,
          label: m.label,
          free: m.free,
        }));
        setModels(list);
        const optimistic = pickModelForList(prefer || "", list, catalog.defaultModelId);
        setModelId(optimistic);
        setCustomModel(false);
      }

      const gen = ++modelsFetchGen.current;
      const persistThreadId = opts?.persistThreadId ?? null;
      void (async () => {
        const api = window.api?.chat;
        if (!api) return;
        const modelsRes = await api.models(credId || null);
        if (gen !== modelsFetchGen.current || !modelsRes.ok) return;

        // Prefer the key's own catalogue (GET {base}/models) so the list always
        // matches the provider this key actually talks to. Curated list is the
        // fallback for hosts that don't expose it or reject the key.
        let list = modelsRes.data;
        if (credId && api.remoteModels) {
          const remote = await api.remoteModels(credId);
          if (gen !== modelsFetchGen.current) return;
          if (remote.ok && remote.data.length > 0) list = remote.data;
        }

        setModels(list);
        const picked = pickModelForList(
          modelIdRef.current,
          list,
          catalog?.defaultModelId,
        );
        setModelId(picked);
        setCustomModel(false);
        if (persistThreadId) {
          void api
            .updateThread(persistThreadId, {
              credentialId: credId || null,
              modelId: picked || null,
            })
            .then((r) => {
              if (r.ok) void refreshThreads();
            });
        }
      })();
    },
    [credentials, providers, refreshThreads],
  );

  const onSelectCredential = useCallback((nextCredId: string) => {
    setCredentialId(nextCredId);
  }, []);

  const onSelectModel = useCallback(
    (nextModelId: string, activeId: string | null) => {
      setCustomModel(false);
      setModelId(nextModelId);
      if (!activeId) return;
      void window.api.chat
        .updateThread(activeId, {
          credentialId: credentialId || null,
          modelId: nextModelId || null,
        })
        .then((r) => {
          if (r.ok) void refreshThreads();
        });
    },
    [credentialId, refreshThreads],
  );

  // Race-safe model list refresh when Key changes (including default credential load).
  // Persist onto the active thread so re-opening the chat does not snap back to Gemini.
  useEffect(() => {
    if (!credentialId) {
      const gen = ++modelsFetchGen.current;
      void window.api?.chat?.models(null).then((r) => {
        if (gen !== modelsFetchGen.current || !r.ok) return;
        setModels(r.data);
      });
      return;
    }
    applyModelsForCredential(credentialId, {
      persistThreadId: activeIdRef.current,
    });
    // Intentionally omit applyModelsForCredential identity — only re-run on Key id.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- credential switch only
  }, [credentialId]);

  return {
    credentials,
    setProviders,
    models,
    credentialId, setCredentialId,
    modelId, setModelId,
    customModel, setCustomModel,
    needsKey,
    activeCredential,
    showCustom,
    refreshCredentials,
    applyModelsForCredential,
    onSelectCredential,
    onSelectModel,
  };
}

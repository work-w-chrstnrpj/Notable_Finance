import { Plus, X } from "lucide-react";
import { useAppTabs } from "@/lib/app-tabs-context";
import { getActiveSectionLabel } from "@/lib/finance-data";
import { cx } from "@/lib/finance-helpers";

/**
 * Chrome-style application tab strip. Each tab is an independent section view;
 * data stays in sync because all tabs share one SQLite store + query cache.
 */
export function WorkspaceTabBar() {
  const { tabs, activeId, activateTab, openTab, closeTab } = useAppTabs();

  return (
    <div className="app-tabs" role="tablist" aria-label="Application tabs">
      <div className="app-tabs__list">
        {tabs.map((tab) => {
          const label = getActiveSectionLabel(tab.section);
          const selected = tab.id === activeId;
          return (
            <div
              key={tab.id}
              role="tab"
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              className={cx("app-tabs__tab", selected && "app-tabs__tab--active")}
              onClick={() => activateTab(tab.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  activateTab(tab.id);
                }
              }}
              onAuxClick={(e) => {
                // Middle-click closes, like browsers.
                if (e.button === 1) {
                  e.preventDefault();
                  closeTab(tab.id);
                }
              }}
              title={label}
            >
              <span className="app-tabs__label">{label}</span>
              <button
                type="button"
                className="app-tabs__close"
                aria-label={`Close ${label} tab`}
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
              >
                <X size={12} strokeWidth={2.25} />
              </button>
            </div>
          );
        })}
        <button
          type="button"
          className="app-tabs__new"
          aria-label="New tab"
          title="New tab (⌘T)"
          onClick={() => openTab("dashboard")}
        >
          <Plus size={14} strokeWidth={2.25} />
        </button>
      </div>
    </div>
  );
}

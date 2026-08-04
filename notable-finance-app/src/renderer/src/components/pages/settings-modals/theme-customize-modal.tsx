import { Palette } from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { useUiSettings } from "@/lib/ui-settings-context";
import { FONT_OPTIONS, loadGoogleFont } from "@/lib/font-loader";
import { ColorPicker } from "@/components/color-picker";
import { Field } from "@/components/ui";
import { SettingsModal } from "@/components/ui/form-modals";
import { cx } from "@/lib/finance-helpers";
import { getPreset, PRESETS } from "@/lib/presets";

/**
 * refactor_development_plan.md Phase 6.1 — pure move out of settings-modals.tsx, unchanged.
 */
function ThemeCustomizeModal({ onClose }: { onClose: () => void }) {
  const { mode, primaryColor, secondaryColor, preset: activePreset, setMode, setPrimaryColor, setSecondaryColor, setPreset } =
    useTheme();
  const { settings, updateSettings } = useUiSettings();
  const currentPreset = getPreset(activePreset);
  const customizable = currentPreset.customizable ?? false;
  const { bodyFont, monoFont, brandFont, receiptFont } = settings.fonts;

  const fontGroups = FONT_OPTIONS.reduce<Record<string, typeof FONT_OPTIONS>>((acc, f) => {
    (acc[f.group] ??= []).push(f);
    return acc;
  }, {});

  const handleFontChange = (key: "bodyFont" | "monoFont" | "brandFont" | "receiptFont", value: string) => {
    if (!customizable) return;
    loadGoogleFont(value);
    void updateSettings({ fonts: { [key]: value } });
  };

  const renderFontSelect = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    disabled?: boolean,
  ) => (
    <Field label={label}>
      <select
        className="settings-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        style={disabled ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
      >
        {Object.entries(fontGroups).map(([group, fonts]) => (
          <optgroup key={group} label={group}>
            {fonts.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </optgroup>
        ))}
      </select>
    </Field>
  );

  return (
    <SettingsModal
      title="Customize Theme"
      subtitle="Personalize your appearance, colors, and fonts."
      onClose={onClose}
      footer={
        <button type="button" className="button button--primary" onClick={onClose}>
          Done
        </button>
      }
    >
      <div className="theme-modal-grid">
        {/* ── Design Presets ───────────────────────────────────── */}
        <div className="theme-modal-section">
          <p className="settings-toggle__title">
            <Palette size={15} style={{ display: "inline", verticalAlign: -2, marginRight: 6 }} />
            Design Preset
          </p>
          <p className="settings-toggle__hint">
            Choose a curated look. The Default preset lets you customize fonts and
            colors freely. Other presets lock fonts and accent colors to their
            design system values.
          </p>
          <div className="preset-grid">
            {PRESETS.map((p) => {
              const isActive = activePreset === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  className={cx("preset-card", isActive && "preset-card--active")}
                  onClick={() => setPreset(p.id)}
                  aria-pressed={isActive}
                >
                  {/* Color preview bar */}
                  <div className="preset-card__bar">
                    <span className="preset-card__swatch" style={{ background: p.suggestedPrimary }} />
                    <span className="preset-card__swatch" style={{ background: p.suggestedSecondary }} />
                    <span
                      className="preset-card__radius-sample"
                      style={{
                        background: "var(--ink-muted)",
                        borderRadius: p.light["--radius"] || "var(--radius)",
                      }}
                    />
                  </div>
                  <div className="preset-card__info">
                    <span className="preset-card__name">{p.name}</span>
                    <span className="preset-card__vibe">{p.vibe}</span>
                  </div>
                  {isActive && <span className="preset-card__check">✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Appearance ───────────────────────────────────────── */}
        <div className="theme-modal-section">
          <p className="settings-toggle__title">Appearance</p>
          <p className="settings-toggle__hint">
            Choose light, dark, or follow your system setting.
          </p>
          <select
            className="settings-select"
            value={mode}
            onChange={(e) => setMode(e.target.value as "light" | "dark" | "system")}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
        </div>
        <div className="theme-modal-section">
          <p className="settings-toggle__title">Colors</p>
          <p className="settings-toggle__hint">
            Customize accent colors applied globally. Presets set defaults but you can
            override here.
            {!customizable && <span style={{ color: "var(--ink-muted)", fontSize: "12px", display: "block", marginTop: 4 }}>Locked by the &ldquo;{currentPreset.name}&rdquo; preset. Switch to Default to customize.</span>}
          </p>
          <div className="theme-color-pickers">
            <div className="theme-color-picker-group">
              <span className="settings-color-label">Primary</span>
              <ColorPicker value={primaryColor} onChange={setPrimaryColor} disabled={!customizable} />
            </div>
            <div className="theme-color-picker-group">
              <span className="settings-color-label">Secondary</span>
              <ColorPicker value={secondaryColor} onChange={setSecondaryColor} disabled={!customizable} />
            </div>
          </div>
        </div>
        <div className="theme-modal-section">
          <p className="settings-toggle__title">Fonts</p>
          <p className="settings-toggle__hint">
            Customize the typeface for body text, numbers/data, and brand headings.
            {customizable ? "Override the preset’s suggested fonts here." : <span>Locked by the &ldquo;{currentPreset.name}&rdquo; preset. Switch to Default to customize.</span>}
          </p>
          <div className="form-grid form-grid--single" style={{ gap: "0.75rem" }}>
            {renderFontSelect("Body Font", bodyFont, (v) => handleFontChange("bodyFont", v), !customizable)}
            {renderFontSelect("Numbers / Data Font", monoFont, (v) => handleFontChange("monoFont", v), !customizable)}
            {renderFontSelect("Brand / Display Font", brandFont, (v) => handleFontChange("brandFont", v), !customizable)}
            {renderFontSelect("Receipt Font", receiptFont, (v) => handleFontChange("receiptFont", v), !customizable)}
          </div>
        </div>
      </div>
    </SettingsModal>
  );
}

export { ThemeCustomizeModal };

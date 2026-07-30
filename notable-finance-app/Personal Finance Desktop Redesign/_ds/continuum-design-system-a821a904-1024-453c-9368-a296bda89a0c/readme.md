# Continuum Design System

A HIG-based (Apple Human Interface Guidelines) design system, built generically so it can be applied to any product — mobile app, desktop app, or responsive web. Built from scratch: no codebase, Figma file, or brand deck was attached to this project, so it authors a standard set of foundations and components rather than recreating an existing product's exact source.

**Sources:** none attached. If a codebase, Figma file, or brand deck becomes available, attach it and this system should be reconciled against it (real component specs, exact copy, real logo/icon assets take precedence over what's authored here).

## Content fundamentals
- **Tone:** calm, direct, instructional — HIG's own voice. Short declarative sentences, present tense, second person ("Tap Delete to remove a note").
- **Casing:** sentence case for body copy and button labels ("Save changes", not "Save Changes"); title case only for nav bar / screen titles ("Notes", "Settings").
- **Voice:** speaks to "you", never "I"; refers to itself in the third person when naming the product ("Notes lets you...").
- **Punctuation:** minimal. No exclamation points. Ellipses only for truncation or a pending action ("Saving…").
- **Emoji:** not used in UI copy or system messaging — this is a systems/utility register, not a marketing one.
- **Errors:** plain-language, blame-free, actionable ("Couldn't save this note. Check your connection and try again.")

## Visual foundations
- **Color:** a saturated system palette (blue accent, plus indigo/green/orange/pink/purple/red/teal/yellow/mint/cyan/brown for status and data) sits over neutral grayscale surfaces. Semantic `label`/`background`/`fill` layers (see `tokens/colors.css`) use opacity-based grays so the same tokens work in light and dark automatically.
- **Type:** Inter stands in for SF Pro (display + text optical sizes), JetBrains Mono for SF Mono. A fixed HIG text-style scale (Large Title → Caption 2) rather than ad hoc sizes — see `tokens/typography.css`.
- **Spacing:** 4pt-based scale (4 → 80px). All tappable controls keep a 44×44pt minimum hit target regardless of visible glyph size.
- **Corner radii:** small controls 6–10px, cards 14px, sheets/modals 20–28px, buttons/pills fully capsule (999px). Never a fixed 8px "everything" radius — radius scales with the size of the surface.
- **Shadows:** soft and understated (`--shadow-1/2/3`) for cards and floating panels; a heavier `--shadow-modal` only for dialogs/sheets. No colored or oversized shadows.
- **Materials (Liquid Glass):** navigation bars, tab bars, toasts, sheets, modals, and segmented controls sit on deep-blur, high-saturation glass (`--material-*` + `--blur-*`), edged with a soft light border (`--glass-border`) and a top-down specular highlight (`--glass-specular`, `--glass-highlight`) that mimics light catching a curved glass surface — matching Apple's current Liquid Glass system. See the Materials card.
- **Backgrounds:** flat system-background colors, not imagery or gradients, behind content. No decorative patterns/textures. The one exception is the thumbnail brand tile (flat accent field, no gradient).
- **Animation:** short and physical. Standard UI transitions use `--ease-standard`/`--ease-emphasized` at 120–380ms; interactive elements (switches, sheets) use a spring curve (`--spring`). No bouncy/exaggerated motion, no slow fades.
- **Hover (web/macOS only):** a subtle darker/lighter fill shift, never a border or shadow pop-in. **Press:** scale to 0.96 (buttons/icon buttons) or a background tint (list rows) — never color inversion.
- **Disabled:** 40% opacity, no pointer.
- **Borders:** hairline (0.5–1px) separators at low-opacity gray, not full-strength black.
- **Transparency/blur:** reserved for fixed chrome that floats over scrolling content (nav bars, tab bars, toasts, sheettops) — never on primary reading content.
- **Imagery vibe:** none supplied. If product photography is added later, HIG favors natural light, true color (not desaturated/cool-toned), minimal grain.
- **Cards:** 1px hairline border + soft shadow by default; `elevated` variant drops the border for a stronger shadow; `flat` drops the shadow for nested contexts.

## Iconography
No proprietary icon set or SF Symbols export was provided (SF Symbols itself is Apple-proprietary and not redistributable here). **Continuum adopts [Lucide](https://lucide.dev) via CDN** (`unpkg.com/lucide-static`) as its icon system — 1.5–2px stroke, 24×24 default, closely matching SF Symbols' regular weight. This is a flagged substitution: swap in real SF Symbols or a proprietary icon export if one becomes available. A few structural glyphs (chevron, plus, checkmark, close) are drawn as tiny inline-SVG paths inside components themselves (e.g. `Checkbox`, `ListRow`'s chevron) since these are UI mechanics, not brand iconography. Emoji are not used as icons.

## Fonts — substitution flagged
No font files were provided. Apple's SF Pro / SF Mono are proprietary and can't be redistributed, so **Inter** (nearest open metric/shape match to SF Pro) and **JetBrains Mono** (nearest to SF Mono) are loaded from Google Fonts CDN in `tokens/fonts.css`. **Please share real SF Pro / SF Mono files (or confirm Inter is fine to ship) so this can be finalized.**

## Index
- `styles.css` — root stylesheet, imports everything below.
- `tokens/` — `colors.css`, `typography.css`, `spacing.css`, `radii.css`, `elevation.css` (shadows + materials), `motion.css` (easing/duration), `fonts.css` (@font-face imports).
- `guidelines/` — foundation specimen cards (Colors, Type, Spacing, Brand: radii/elevation/materials/motion/interaction-states/iconography).
- `components/forms/` — Button, IconButton, TextField, Switch, Checkbox, Radio, SegmentedControl, Slider.
- `components/feedback/` — Badge, Progress, Spinner, Toast, Alert, Tooltip.
- `components/overlays/` — Modal, Sheet.
- `components/navigation/` — NavigationBar, TabBar, Tabs.
- `components/data/` — Card, List, ListRow.
- `ui_kits/notes/` — interactive Notes app recreation (iOS / macOS / Web) built entirely from the components above.
- `SKILL.md` — Claude Code-compatible skill wrapper for this system.

### Intentional additions
No source defined a component inventory, so the set above is the standard HIG-derived primitive list sized to a typical app (forms, feedback, overlays, navigation, data display). None of these are "extra" beyond what was requested (extended scope).

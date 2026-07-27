/**
 * Dynamic Google Fonts loader.
 *
 * Injects a <link> tag for the requested font family. No-ops for system fonts
 * that don't need loading (system-ui, Georgia, Arial, etc.) and for locally
 * bundled fonts (Inter, DM Mono, Instrument Serif).
 */

const loaded = new Set<string>()

const LOCAL_FONTS = new Set([
  "Inter",
  "DM Mono",
  "Instrument Serif",
])

const SYSTEM_FONTS = new Set([
  "system-ui",
  "Georgia",
  "Courier New",
  "Arial",
  "Times New Roman",
  "Times",
  "Courier",
  "Verdana",
  "Trebuchet MS",
  "Impact",
  "Comic Sans MS",
])

/** Map of font family name → Google Fonts family parameter (space-separated words). */
const GOOGLE_FONT_MAP: Record<string, string> = {
  "Roboto": "Roboto",
  "Open Sans": "Open+Sans",
  "Lato": "Lato",
  "Montserrat": "Montserrat",
  "Poppins": "Poppins",
  "Nunito": "Nunito",
  "Raleway": "Raleway",
  "Work Sans": "Work+Sans",
  "Source Sans 3": "Source+Sans+3",
  "DM Sans": "DM+Sans",
  "Outfit": "Outfit",
  "Plus Jakarta Sans": "Plus+Jakarta+Sans",
  "Manrope": "Manrope",
  "Space Grotesk": "Space+Grotesk",
  "Figtree": "Figtree",
  "Sora": "Sora",
  "Albert Sans": "Albert+Sans",
  "Urbanist": "Urbanist",
  "Lexend": "Lexend",
  "Cabin": "Cabin",
  "Barlow": "Barlow",
  "Rubik": "Rubik",
  "Nunito Sans": "Nunito+Sans",
  "Josefin Sans": "Josefin+Sans",
  "Quicksand": "Quicksand",
  "Fira Sans": "Fira+Sans",
  "Karla": "Karla",
  "Crimson Text": "Crimson+Text",
  "Merriweather": "Merriweather",
  "Playfair Display": "Playfair+Display",
  "Libre Baskerville": "Libre+Baskerville",
  "Lora": "Lora",
  "EB Garamond": "EB+Garamond",
  "Cormorant Garamond": "Cormorant+Garamond",
  "Bitter": "Bitter",
  "PT Serif": "PT+Serif",
  "Source Serif 4": "Source+Serif+4",
  "IBM Plex Mono": "IBM+Plex+Mono",
  "JetBrains Mono": "JetBrains+Mono",
  "Fira Code": "Fira+Code",
  "Source Code Pro": "Source+Code+Pro",
  "Ubuntu Mono": "Ubuntu+Mono",
  "Inconsolata": "Inconsolata",
  "Space Mono": "Space+Mono",
  "Caveat": "Caveat",
  "Dancing Script": "Dancing+Script",
  "Pacifico": "Pacifico",
  "Satisfy": "Satisfy",
  "Great Vibes": "Great+Vibes",
}

export function loadGoogleFont(family: string): void {
  if (loaded.has(family) || LOCAL_FONTS.has(family) || SYSTEM_FONTS.has(family)) {
    return
  }

  const query = GOOGLE_FONT_MAP[family]
  if (!query) return

  const id = `gf-${query.toLowerCase()}`
  if (document.getElementById(id)) {
    loaded.add(family)
    return
  }

  const link = document.createElement("link")
  link.id = id
  link.rel = "stylesheet"
  link.href = `https://fonts.googleapis.com/css2?family=${query}:wght@300;400;500;600;700&display=swap`
  document.head.appendChild(link)
  loaded.add(family)
}

export interface FontOption {
  value: string
  label: string
  group: string
}

export const FONT_OPTIONS: FontOption[] = [
  // Sans-serif
  { value: "Inter", label: "Inter", group: "Sans-serif" },
  { value: "DM Sans", label: "DM Sans", group: "Sans-serif" },
  { value: "Roboto", label: "Roboto", group: "Sans-serif" },
  { value: "Open Sans", label: "Open Sans", group: "Sans-serif" },
  { value: "Lato", label: "Lato", group: "Sans-serif" },
  { value: "Montserrat", label: "Montserrat", group: "Sans-serif" },
  { value: "Poppins", label: "Poppins", group: "Sans-serif" },
  { value: "Nunito", label: "Nunito", group: "Sans-serif" },
  { value: "Raleway", label: "Raleway", group: "Sans-serif" },
  { value: "Work Sans", label: "Work Sans", group: "Sans-serif" },
  { value: "Source Sans 3", label: "Source Sans 3", group: "Sans-serif" },
  { value: "Outfit", label: "Outfit", group: "Sans-serif" },
  { value: "Plus Jakarta Sans", label: "Plus Jakarta Sans", group: "Sans-serif" },
  { value: "Manrope", label: "Manrope", group: "Sans-serif" },
  { value: "Space Grotesk", label: "Space Grotesk", group: "Sans-serif" },
  { value: "Figtree", label: "Figtree", group: "Sans-serif" },
  { value: "Sora", label: "Sora", group: "Sans-serif" },
  { value: "Albert Sans", label: "Albert Sans", group: "Sans-serif" },
  { value: "Urbanist", label: "Urbanist", group: "Sans-serif" },
  { value: "Lexend", label: "Lexend", group: "Sans-serif" },
  { value: "Cabin", label: "Cabin", group: "Sans-serif" },
  { value: "Barlow", label: "Barlow", group: "Sans-serif" },
  { value: "Rubik", label: "Rubik", group: "Sans-serif" },
  { value: "Nunito Sans", label: "Nunito Sans", group: "Sans-serif" },
  { value: "Josefin Sans", label: "Josefin Sans", group: "Sans-serif" },
  { value: "Quicksand", label: "Quicksand", group: "Sans-serif" },
  { value: "Fira Sans", label: "Fira Sans", group: "Sans-serif" },
  { value: "Karla", label: "Karla", group: "Sans-serif" },
  // Serif
  { value: "Instrument Serif", label: "Instrument Serif", group: "Serif" },
  { value: "Crimson Text", label: "Crimson Text", group: "Serif" },
  { value: "Merriweather", label: "Merriweather", group: "Serif" },
  { value: "Playfair Display", label: "Playfair Display", group: "Serif" },
  { value: "Libre Baskerville", label: "Libre Baskerville", group: "Serif" },
  { value: "Lora", label: "Lora", group: "Serif" },
  { value: "EB Garamond", label: "EB Garamond", group: "Serif" },
  { value: "Cormorant Garamond", label: "Cormorant Garamond", group: "Serif" },
  { value: "Bitter", label: "Bitter", group: "Serif" },
  { value: "PT Serif", label: "PT Serif", group: "Serif" },
  { value: "Source Serif 4", label: "Source Serif 4", group: "Serif" },
  // Display / Script
  { value: "Caveat", label: "Caveat", group: "Display / Script" },
  { value: "Dancing Script", label: "Dancing Script", group: "Display / Script" },
  { value: "Pacifico", label: "Pacifico", group: "Display / Script" },
  { value: "Satisfy", label: "Satisfy", group: "Display / Script" },
  { value: "Great Vibes", label: "Great Vibes", group: "Display / Script" },
  // Monospace
  { value: "DM Mono", label: "DM Mono", group: "Monospace" },
  { value: "IBM Plex Mono", label: "IBM Plex Mono", group: "Monospace" },
  { value: "JetBrains Mono", label: "JetBrains Mono", group: "Monospace" },
  { value: "Fira Code", label: "Fira Code", group: "Monospace" },
  { value: "Source Code Pro", label: "Source Code Pro", group: "Monospace" },
  { value: "Ubuntu Mono", label: "Ubuntu Mono", group: "Monospace" },
  { value: "Inconsolata", label: "Inconsolata", group: "Monospace" },
  { value: "Space Mono", label: "Space Mono", group: "Monospace" },
  // System
  { value: "system-ui", label: "System UI", group: "System" },
  { value: "Georgia", label: "Georgia", group: "System" },
  { value: "Courier New", label: "Courier New", group: "System" },
  { value: "Arial", label: "Arial", group: "System" },
  { value: "Times New Roman", label: "Times New Roman", group: "System" },
  { value: "Verdana", label: "Verdana", group: "System" },
  { value: "Trebuchet MS", label: "Trebuchet MS", group: "System" },
]

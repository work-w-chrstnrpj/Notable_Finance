// Payment network marks. These are stand-in marks drawn to match the approved prototype;
// official brand assets can replace them here, in this one file, without touching the card.

export type NetworkKey = "visa" | "mastercard" | "amex" | "jcb" | "unionpay";

const ALIASES: Record<string, NetworkKey> = {
  visa: "visa",
  mastercard: "mastercard",
  mc: "mastercard",
  amex: "amex",
  americanexpress: "amex",
  jcb: "jcb",
  unionpay: "unionpay",
};

/** Match a Notion Select value to a known network ("Master Card" and "American Express" count). */
export function normalizeNetwork(value: string | null | undefined): NetworkKey | null {
  if (!value) return null;
  return ALIASES[value.toLowerCase().replace(/[^a-z]/g, "")] ?? null;
}

/** A Payment Network of N/A (Notion's way of saying the account has none). */
export function isNotApplicable(value: string | null | undefined): boolean {
  return !!value && /^(n\/?a|not applicable|not available)$/i.test(value.trim());
}

/** True only for a real network value: not empty and not N/A. */
export function hasNetwork(value: string | null | undefined): boolean {
  return !!value && value.trim() !== "" && !isNotApplicable(value);
}

export const NO_NETWORK_LABEL = "No Available Network";

const FONT = "Inter,sans-serif";

export function NetworkMark({ network }: { network: NetworkKey }) {
  switch (network) {
    case "visa":
      return (
        <svg viewBox="0 0 90 30" role="img" aria-label="Visa">
          <text x="45" y="25" textAnchor="middle" fontFamily={FONT} fontWeight={800} fontStyle="italic" fontSize={30} letterSpacing={-1} fill="currentColor">
            VISA
          </text>
        </svg>
      );
    case "mastercard":
      return (
        <svg viewBox="0 0 60 38" role="img" aria-label="Mastercard">
          <circle cx="21" cy="19" r="17" fill="#eb001b" />
          <circle cx="39" cy="19" r="17" fill="#f79e1b" />
          <path d="M30 5.4a17 17 0 0 1 0 27.2 17 17 0 0 1 0-27.2z" fill="#ff5f00" />
        </svg>
      );
    case "amex":
      // Text only, like the printed card: no colored box, takes the card's text color.
      return (
        <svg viewBox="0 0 84 30" role="img" aria-label="American Express">
          <text x="84" y="13" textAnchor="end" fontFamily={FONT} fontWeight={800} fontSize={13} letterSpacing={0.3} fill="currentColor">
            AMERICAN
          </text>
          <text x="84" y="27" textAnchor="end" fontFamily={FONT} fontWeight={800} fontSize={13} letterSpacing={0.3} fill="currentColor">
            EXPRESS
          </text>
        </svg>
      );
    case "jcb":
      return (
        <svg viewBox="0 0 66 40" role="img" aria-label="JCB">
          <rect x="0" width="20" height="40" rx="6" fill="#0e4c92" />
          <rect x="23" width="20" height="40" rx="6" fill="#d8232a" />
          <rect x="46" width="20" height="40" rx="6" fill="#0a8a3c" />
          {(["J", "C", "B"] as const).map((l, i) => (
            <text key={l} x={10 + i * 23} y="25" textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={13} fill="#fff">
              {l}
            </text>
          ))}
        </svg>
      );
    case "unionpay":
      return (
        <svg viewBox="0 0 70 40" role="img" aria-label="UnionPay">
          <path d="M10 0h18l-8 40H2z" fill="#d6212f" />
          <path d="M26 0h20L38 40H18z" fill="#0f4f8f" />
          <path d="M44 0h16l-8 40H36z" fill="#0b8a76" />
          <text x="31" y="25" textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={9} fill="#fff">
            UnionPay
          </text>
        </svg>
      );
  }
}

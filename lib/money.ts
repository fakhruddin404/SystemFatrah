/** Ringgit helpers. Prices are stored as numeric(10,2) and handled in sen internally. */

export interface FormatMyrOptions {
  /** Always show two decimals (used for totals), e.g. "RM 960.00". */
  fixed?: boolean;
}

/** "RM 480" for whole amounts, "RM 480.50" otherwise. */
export function formatMyr(amount: number, options: FormatMyrOptions = {}): string {
  const value = Number.isFinite(amount) ? amount : 0;
  const showDecimals = options.fixed || !Number.isInteger(value);
  return `RM ${showDecimals ? value.toFixed(2) : String(value)}`;
}

/** Parses "RM 480" / "RM 480.50" style strings. Returns 0 when nothing numeric is found. */
export function parseMyr(text: string): number {
  const n = parseFloat(text.replace(/[^0-9.]/g, ''));
  return Number.isNaN(n) ? 0 : n;
}

/** Converts ringgit to whole sen, avoiding floating-point drift when summing. */
export function toSen(amount: number): number {
  return Math.round(amount * 100);
}

export function fromSen(sen: number): number {
  return sen / 100;
}

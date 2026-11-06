export const fmt = (n: number) => Math.round(n).toLocaleString();

/** Parses user text to a non-negative number; returns null when invalid. */
export function parseNum(text: string): number | null {
  const t = text.trim().replace(',', '.');
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

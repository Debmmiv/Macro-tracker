/** All dates are local calendar days formatted YYYY-MM-DD. */
export function toISODate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(s: string, n: number): string {
  const d = parseISODate(s);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

export function formatDay(s: string): string {
  const today = toISODate();
  if (s === today) return 'Today';
  if (s === addDays(today, -1)) return 'Yesterday';
  return parseISODate(s).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

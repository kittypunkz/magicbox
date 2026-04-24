// SQLite datetime() stores "YYYY-MM-DD HH:MM:SS" — no T, no Z.
// new Date() with that format has undefined browser behavior.
// Always normalise to ISO 8601 UTC before constructing a Date.
function parseDB(iso: string): Date {
  if (!iso) return new Date(NaN);
  if (iso.includes('Z') || /[+-]\d{2}:\d{2}$/.test(iso)) return new Date(iso);
  return new Date(iso.replace(' ', 'T') + 'Z');
}

const BKK = 'Asia/Bangkok';

export function formatDate(iso: string): string {
  return parseDB(iso).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric', timeZone: BKK,
  });
}

export function formatDateTime(iso: string): string {
  return parseDB(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', timeZone: BKK,
  });
}

export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - parseDB(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(iso);
}

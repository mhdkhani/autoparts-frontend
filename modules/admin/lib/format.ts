const DATE = new Intl.DateTimeFormat('fa-IR', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Tehran',
});

/** ISO date → Persian (Jalali) date and time in Tehran time; "—" when empty. */
export function faDate(iso: string | null | undefined): string {
  return iso ? DATE.format(new Date(iso)) : '—';
}

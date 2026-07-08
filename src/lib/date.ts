const TZ = 'Asia/Jakarta';

export function formatDateWIB(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' }
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { ...options, timeZone: TZ });
}

export function formatStringWIB(
  date: Date,
  options: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' }
): string {
  return date.toLocaleString('en-US', { ...options, timeZone: TZ });
}

export function toISODateWIB(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const year = parts.find(p => p.type === 'year')!.value;
  const month = parts.find(p => p.type === 'month')!.value;
  const day = parts.find(p => p.type === 'day')!.value;
  return `${year}-${month}-${day}`;
}

export function currentYearWIB(): number {
  return Number(
    new Intl.DateTimeFormat('en-US', { timeZone: TZ, year: 'numeric' }).format(new Date())
  );
}



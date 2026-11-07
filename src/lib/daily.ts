const prague = { timeZone: 'Europe/Prague' };
const dayLength = 86_400_000;
const firstDay = Date.UTC(2026, 10, 6);

export function getDailyDate(date = new Date()) {
  return {
    iso: new Intl.DateTimeFormat('sv-SE', prague).format(date),
    label: new Intl.DateTimeFormat('cs-CZ', {
      ...prague, weekday: 'long', day: 'numeric', month: 'long',
    }).format(date),
  };
}

export function dailyIndex(date: string, count: number) {
  const days = Math.floor((Date.parse(date) - firstDay) / dayLength);
  return ((days % count) + count) % count;
}

import { dailyIndex, getDailyDate } from './daily';
import type { ProverbLink } from './catalog';
import { buildRow } from './row';

const data = document.querySelector('#daily-data')?.textContent;
export const daily = data ? JSON.parse(data) as ProverbLink[] : [];

/** Re-renders "Známá přísloví" on the homepage: the proverbs of the previous days, newest first, for the visitor's date. */
export function renderKnown() {
  const list = document.querySelector<HTMLElement>('#cards[data-known]');
  if (!daily.length || !list) return false;
  const today = dailyIndex(getDailyDate().iso, daily.length);
  const count = Math.min(Number(list.dataset.known) || 12, daily.length - 1);
  const rows = Array.from({ length: count }, (_, offset) => daily[(today - 1 - offset + daily.length) % daily.length]);
  list.replaceChildren(...rows.map((entry, index) => buildRow(entry, index + 1)));
  return true;
}

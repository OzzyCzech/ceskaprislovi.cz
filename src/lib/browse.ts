import { themePath } from './theme-path';
import { dailyIndex, getDailyDate } from './daily';
import { loadCatalog, type Entry } from './catalog';
import { renderKnown } from './known';

const hero = document.querySelector<HTMLElement>('#daily-proverb');

function showProverb([slug, text, tags]: Entry) {
  if (!hero) return;
  hero.dataset.slug = slug;
  const title = hero.querySelector('h1')!;
  title.textContent = text.endsWith('.') ? text.slice(0, -1) : text;
  if (text.endsWith('.')) {
    const dot = document.createElement('span');
    dot.className = 'display-dot';
    dot.textContent = '.';
    title.append(dot);
  }
  hero.querySelector<HTMLAnchorElement>('#daily-link')!.href = `/${slug}`;
  const theme = hero.querySelector<HTMLAnchorElement>('#daily-theme')!;
  theme.textContent = tags[0] ?? '';
  if (tags[0]) theme.href = themePath(tags[0]);
  else theme.removeAttribute('href');
  theme.parentElement!.hidden = !tags.length;
}

if (hero) {
  const date = getDailyDate();
  const time = hero.querySelector('time')!;
  time.textContent = date.label;
  time.dateTime = date.iso;
  const daily = JSON.parse(hero.dataset.daily!) as Entry[];
  const today = dailyIndex(date.iso, daily.length);
  showProverb(daily[today]);
  // The build may be older than today, so the list of previous days is rendered for the visitor's date.
  if (!new URLSearchParams(location.search).toString()) renderKnown();
}

async function pickRandom(mode: 'hero' | 'detail') {
  try {
    const current = mode === 'hero' ? hero?.dataset.slug : location.pathname.slice(1);
    const entries = (await loadCatalog()).filter(([slug]) => slug !== current);
    const entry = entries[Math.floor(Math.random() * entries.length)];
    if (!entry) return;
    if (mode === 'hero' && hero) showProverb(entry);
    else location.assign(`/${entry[0]}`);
  } catch {
    const status = document.querySelector('#site-status')!;
    status.textContent = 'Přísloví se nepodařilo načíst. Zkuste to znovu.';
  }
}

for (const link of document.querySelectorAll<HTMLAnchorElement>('[data-random]')) {
  link.addEventListener('click', (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    void pickRandom(link.dataset.random === 'hero' ? 'hero' : 'detail');
  });
}
const params = new URLSearchParams(location.search);
const oldTheme = params.get('tema')?.trim();
if (hero && oldTheme && !params.has('q') && !params.has('pismeno')) {
  location.replace(themePath(oldTheme));
} else if (params.has('nahodne')) {
  void pickRandom('detail');
}

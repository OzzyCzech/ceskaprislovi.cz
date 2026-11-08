import { themePath } from './theme-path';
import { dailyIndex, getDailyDate } from './daily';
import { loadCatalog, type ProverbLink } from './catalog';
import { daily } from './known';

const hero = document.querySelector<HTMLElement>('#daily-proverb');

function showProverb([slug, text]: ProverbLink) {
  if (!hero) return;
  hero.dataset.slug = slug;
  hero.dataset.proverb = text;
  const title = hero.querySelector<HTMLAnchorElement>('#daily-title')!;
  title.href = `/${slug}`;
  title.textContent = text.endsWith('.') ? text.slice(0, -1) : text;
  if (text.endsWith('.')) {
    const dot = document.createElement('span');
    dot.className = 'display-dot';
    dot.textContent = '.';
    title.append(dot);
  }
  hero.querySelector<HTMLAnchorElement>('#daily-link')!.href = `/${slug}`;
}

if (hero) {
  const date = getDailyDate();
  const time = hero.querySelector('time')!;
  time.textContent = date.label;
  time.dateTime = date.iso;
  const today = dailyIndex(date.iso, daily.length);
  if (daily[today][0] !== hero.dataset.slug) showProverb(daily[today]);
}

async function pickRandom(mode: 'hero' | 'detail') {
  try {
    const current = mode === 'hero' ? hero?.dataset.slug : location.pathname.slice(1);
    const entries = (await loadCatalog()).filter(([slug]) => slug !== current);
    const entry = entries[Math.floor(Math.random() * entries.length)];
    if (!entry) return;
    if (mode === 'hero' && hero) showProverb([entry[0], entry[1]]);
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

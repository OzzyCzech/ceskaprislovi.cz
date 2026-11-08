import type uFuzzy from '@leeoniya/ufuzzy';
import { normalize } from './normalize';
import { loadCatalog, type Entry } from './catalog';
import { initialLetter, letters } from './alphabet';
import { buildRow } from './row';
import { daily, renderKnown } from './known';
import { dailyIndex, getDailyDate } from './daily';

type Catalog = { entries: Entry[]; haystack: string[]; tags: string[][]; letters: string[] };

const form = document.querySelector<HTMLFormElement>('#hledat')!;
const input = document.querySelector<HTMLInputElement>('#dotaz')!;
const inspiration = document.querySelector<HTMLElement>('#inspirace')!;
const heading = document.querySelector<HTMLHeadingElement>('#results-heading')!;
const status = document.querySelector<HTMLElement>('#search-status')!;
const cards = document.querySelector<HTMLElement>('#cards')!;
const all = document.querySelector<HTMLAnchorElement>('#all-proverbs')!;
const clear = document.querySelector<HTMLButtonElement>('#clear-search')!;
const more = document.querySelector<HTMLButtonElement>('#more-results')!;
const pageSize = 24;
const minLiveLength = 2;
const number = new Intl.NumberFormat('cs-CZ');
const czech = new Intl.Collator('cs');
const today = dailyIndex(getDailyDate().iso, daily.length);
let showsKnown = cards.querySelector('a')?.getAttribute('href') === `/${daily[(today - 1 + daily.length) % daily.length]?.[0]}`;
let matchers: Promise<{ exact: uFuzzy; fuzzy: uFuzzy }> | undefined;
function loadMatchers() {
  matchers ??= import('@leeoniya/ufuzzy').then(({ default: Matcher }) => ({
    exact: new Matcher({ intraMode: 0 }),
    fuzzy: new Matcher({
      intraMode: 1,
      // Allow a substitution from four letters up, including one-vowel differences in Czech endings.
      intraRules: (term) => term.length >= 4
        ? { intraSlice: [1, Infinity], intraIns: 1, intraSub: 1, intraTrn: 1, intraDel: term.length >= 5 ? 1 : 0 }
        : { intraSlice: [1, Infinity], intraIns: 0, intraSub: 0, intraTrn: term.length === 3 ? 1 : 0, intraDel: 0 },
    }),
  }));
  return matchers;
}
let catalog: Promise<Catalog> | undefined;
let matches: Entry[] = [];
let shown = 0;
let generation = 0;
let debounce: number | undefined;

function searchCatalog() {
  catalog ??= loadCatalog().then((entries) => ({
    entries,
    haystack: entries.map(([, text, tags, alternatives]) => [text, ...(alternatives ?? []), ...tags].map(normalize).join(' | ')),
    tags: entries.map(([, , tags]) => tags.map(normalize)),
    letters: entries.map(([, text]) => initialLetter(text)),
  })).catch((error) => {
    catalog = undefined;
    throw error;
  });
  return catalog;
}

function rank(matcher: uFuzzy, haystack: string[], needle: string) {
  const [indexes, info, order] = matcher.search(haystack, needle, 1, 2_000);
  if (!indexes) return [];
  if (!info || !order) return [...indexes];
  return order.map((position) => info.idx[position]);
}

function appendResults(focusFirst = false) {
  const batch = matches.slice(shown, shown + pageSize).map((entry, index) => buildRow(entry, shown + index + 1));
  cards.append(...batch);
  shown += batch.length;
  more.hidden = shown >= matches.length;
  if (focusFirst) batch[0]?.querySelector('a')?.focus();
}

async function showResults(scroll = false) {
  const current = ++generation;
  const params = new URLSearchParams(location.search);
  const query = params.get('q')?.trim() ?? '';
  const theme = params.get('tema')?.trim() ?? '';
  const letter = params.get('pismeno') ?? '';
  const collection = params.has('sbirka');
  const term = normalize(query);
  const normalizedTheme = normalize(theme);
  const active = Boolean(term || theme || letter || collection);
  if (document.activeElement !== input) input.value = query;
  inspiration.hidden = Boolean(query) && !['#temata', '#abeceda'].includes(location.hash);
  all.hidden = active;
  clear.hidden = !active;
  more.hidden = true;
  cards.removeAttribute('aria-busy');

  if (!active) {
    heading.textContent = 'Známá přísloví';
    status.textContent = '';
    if (!showsKnown) showsKnown = renderKnown();
    return;
  }

  heading.textContent = theme ? `Téma: ${theme}` : letter ? (letter === '…' ? 'Ostatní znaky' : `Písmeno ${letter}`) : collection ? 'Celá sbírka' : 'Výsledky hledání';
  status.textContent = 'Hledám ve sbírce…';
  cards.setAttribute('aria-busy', 'true');
  if (scroll) document.querySelector('#vysledky')?.scrollIntoView();

  try {
    const [data, matcher] = await Promise.all([searchCatalog(), term ? loadMatchers() : undefined]);
    if (current !== generation) return;

    const allowed = (index: number) =>
      (!letter || (letters.includes(letter) && data.letters[index] === letter)) &&
      (!theme || data.tags[index].includes(normalizedTheme));

    let found: number[];
    if (matcher) {
      const { exact, fuzzy } = matcher;
      found = rank(exact, data.haystack, term).filter(allowed);
      if (found.length < 10) {
        const seen = new Set(found);
        found.push(...rank(fuzzy, data.haystack, term).filter((index) => allowed(index) && !seen.has(index)));
      }
    } else {
      found = data.entries.map((_, index) => index).filter(allowed);
      found.sort((a, b) => czech.compare(data.entries[a][1], data.entries[b][1]));
    }

    matches = found.map((index) => data.entries[index]);
    shown = 0;
    cards.replaceChildren();
    showsKnown = false;
    status.textContent = matches.length
      ? `Počet nalezených přísloví: ${number.format(matches.length)}`
      : 'Žádné přísloví se nenašlo. Zkuste jiné slovo nebo kratší dotaz.';
    appendResults();
  } catch {
    if (current === generation) status.textContent = 'Sbírku se nepodařilo načíst. Zkuste hledat znovu.';
  } finally {
    if (current === generation) cards.removeAttribute('aria-busy');
  }
}

function queryUrl(query: string) {
  return query ? `/?q=${encodeURIComponent(query)}` : '/';
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  clearTimeout(debounce);
  const query = input.value.trim();
  history.pushState(null, '', queryUrl(query));
  void showResults(Boolean(query));
});
input.addEventListener('input', () => {
  clearTimeout(debounce);
  const query = input.value.trim();
  if (query && query.length < minLiveLength) return;
  debounce = window.setTimeout(() => {
    const url = queryUrl(query);
    if (location.pathname + location.search === url) return;
    history.replaceState(null, '', url);
    void showResults();
  }, 150);
});
clear.addEventListener('click', () => {
  history.pushState(null, '', '/');
  input.value = '';
  void showResults();
  input.focus();
});
more.addEventListener('click', () => appendResults(true));
window.addEventListener('popstate', () => void showResults());
window.addEventListener('hashchange', () => {
  if (['#temata', '#abeceda'].includes(location.hash)) {
    inspiration.hidden = false;
    document.querySelector(location.hash)?.scrollIntoView();
  }
});
// Links to /#hledat (header icon, 404 page) land in the search field, not just at the form.
function focusSearch() {
  form.scrollIntoView({ block: 'start' });
  input.focus({ preventScroll: true });
}
document.addEventListener('click', (event) => {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = (event.target as Element | null)?.closest?.<HTMLAnchorElement>('a[href]');
  if (!link || new URL(link.href).hash !== '#hledat' || link.origin !== location.origin) return;
  event.preventDefault();
  history.replaceState(null, '', '/#hledat');
  focusSearch();
});
window.addEventListener('hashchange', () => { if (location.hash === '#hledat') focusSearch(); });
// On a fresh load the browser's own fragment scroll runs after the script and clears focus, so wait for it.
if (location.hash === '#hledat') {
  const focusAfterLoad = () => requestAnimationFrame(focusSearch);
  if (document.readyState === 'complete') focusAfterLoad();
  else window.addEventListener('load', focusAfterLoad, { once: true });
}
void showResults();

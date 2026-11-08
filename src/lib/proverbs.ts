import { createHash } from 'node:crypto';
import input from '../data/prislovi.json';
import wording from '../data/zneni.json';
import known from '../data/zname.json';
import { slugOf } from './slug';

export type Proverb = { text: string; tags: string[]; slug: string; variantOf?: string; alternatives?: string[]; meaning?: string; source?: string };

const modernVariant = {
  text: 'Kdo chce psa bít, hůl si vždy najde.',
  tags: ['výmluvy', 'psi', 'nespravedlnost'],
  variantOf: 'Snadno hůl najíti, kdo chce psa bíti.',
  meaning: 'Kdo chce někomu uškodit, záminku si vždycky najde. Varuje před lidmi, kteří hledají důvod, aby mohli druhého potrestat nebo se ho zbavit.',
};

const preferredWording = new Map(wording as [string, string][]);

const unique = new Map<string, Omit<Proverb, 'slug'>>();
for (const entry of [...input, modernVariant]) {
  const text = preferredWording.get(entry.text) ?? entry.text;
  const proverb: Omit<Proverb, 'slug'> = unique.get(text) ?? { ...entry, text };
  proverb.tags = [...new Set([...proverb.tags, ...entry.tags])];
  const alternatives = [...(proverb.alternatives ?? []), ...('alternatives' in entry ? entry.alternatives : []), ...(text !== entry.text ? [entry.text] : [])];
  if (alternatives.length) proverb.alternatives = [...new Set(alternatives)].filter((wording) => wording !== text);
  if (!proverb.meaning && 'meaning' in entry && entry.meaning) proverb.meaning = entry.meaning;
  unique.set(text, proverb);
}

const reserved = new Set(['index', '404', 'sitemap', 'sitemap-index', 'prislovi-index', 'o-projektu', 'co-je-prislovi', 'temata', 'teta-katerina', 'abeceda']);
export const proverbs = Array.from(unique.values(), (entry): Proverb => {
  const base = entry.variantOf ? 'kdo-chce-psa-byt-hul-si-vzdy-najde' : slugOf(entry.text);
  const digest = createHash('sha256').update(entry.text).digest('hex').slice(0, 12);
  let slug = reserved.has(base) ? `${base}-${digest}` : base;
  for (let suffix = 2; reserved.has(slug); suffix++) slug = `${base}-${digest}-${suffix}`;
  reserved.add(slug);
  return { ...entry, slug };
});

const byText = new Map(proverbs.map((entry) => [entry.text, entry]));
/** The 365 best-known proverbs in rotation order; day 1 is 6 November 2026 (see src/data/zname.json). */
export const dailyProverbs = (known as string[]).map((text) => {
  const entry = byText.get(text);
  if (!entry) throw new Error(`Známé přísloví není v datech: ${text}`);
  return entry;
});
export const featured = dailyProverbs[0];
export const themes = ['práce', 'láska', 'rozum', 'štěstí', 'domov', 'přátelství', 'krása', 'zvířata', 'čas', 'řeč', 'mlčení', 'ptáci'];

/** Proverbs shown before today's one, newest first, wrapping around the set so the list is never empty. */
export function recentDaily(todayIndex: number, count = 12) {
  const total = dailyProverbs.length;
  return Array.from({ length: Math.min(count, total - 1) }, (_, offset) => dailyProverbs[(todayIndex - 1 - offset + total) % total]);
}

export const proverbsByTheme = new Map<string, Proverb[]>();
for (const proverb of proverbs) {
  for (const tag of proverb.tags) {
    const entries = proverbsByTheme.get(tag) ?? [];
    entries.push(proverb);
    proverbsByTheme.set(tag, entries);
  }
}

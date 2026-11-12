import { normalize } from './normalize';
import type { Proverb } from './proverbs';

const stopWords = new Set(normalize('a aby aj ale an ani ano as až ba bez bo bude buď by byl byla bylo byly býti být co či do ho i jak jako je jeho jej jen jest již jsou k kam kde kdo když ke ku má mě mi mne mu na nad nám nás ne neb nebo nech než nic o od on ona ono pak po pod pro před při s se si své svá svůj ta tak také tam ten tím to tu ty u už v ve vše za ze že').split(' '));

function words(text: string) {
  return new Set(normalize(text).split(' ').filter((word) => word.length > 2 && !stopWords.has(word)));
}

/** Equal scores should not always favor the first entries in the collection. */
function tieBreak(source: string, target: string) {
  let hash = 2166136261;
  for (const character of `${source}\0${target}`) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return hash >>> 0;
}

/** Build once for the collection; the index stays out of the browser bundle. */
export function createRelatedProverbs(collection: readonly Proverb[]) {
  const entries = new Map(collection.map((proverb) => [proverb.slug, {
    proverb, tags: new Set(proverb.tags), words: words(proverb.text), norm: 0,
  }]));
  const byTag = new Map<string, Set<string>>();
  const byWord = new Map<string, Set<string>>();
  for (const [slug, entry] of entries) {
    for (const [values, index] of [[entry.tags, byTag], [entry.words, byWord]] as const) {
      for (const value of values) {
        if (!index.has(value)) index.set(value, new Set());
        index.get(value)!.add(slug);
      }
    }
  }
  // Rare words carry more information than words used throughout the collection.
  const weights = new Map(Array.from(byWord, ([word, slugs]) => [word, 1 + Math.log(entries.size / slugs.size)]));
  for (const entry of entries.values()) {
    entry.norm = Math.sqrt([...entry.words].reduce((sum, word) => sum + weights.get(word)! ** 2, 0));
  }

  return (proverb: Proverb, count = 3): Proverb[] => {
    const source = entries.get(proverb.slug);
    if (!source || count <= 0) return [];
    const candidates = new Set<string>();
    for (const [values, index] of [[source.tags, byTag], [source.words, byWord]] as const) {
      for (const value of values) {
        for (const slug of index.get(value) ?? []) candidates.add(slug);
      }
    }
    candidates.delete(proverb.slug);
    const ranked = [...candidates].map((slug) => {
      const target = entries.get(slug)!;
      const sharedTags = [...source.tags].filter((tag) => target.tags.has(tag)).length;
      const tagSimilarity = sharedTags / (source.tags.size + target.tags.size - sharedTags || 1);
      let dot = 0;
      for (const word of source.words) {
        if (target.words.has(word)) dot += weights.get(word)! ** 2;
      }
      const textSimilarity = dot / (source.norm * target.norm || 1);
      return { slug, score: tagSimilarity + 2 * textSimilarity };
    });
    const compareTies = (a: string, b: string) => tieBreak(proverb.slug, a) - tieBreak(proverb.slug, b) || (a < b ? -1 : a > b ? 1 : 0);
    ranked.sort((a, b) => b.score - a.score || compareTies(a.slug, b.slug));
    const selected = ranked.slice(0, count).map(({ slug }) => slug);
    // Sparse topics still offer onward navigation, without a fixed popular trio.
    if (selected.length < count) {
      const fallback = [...entries.keys()].filter((slug) => slug !== proverb.slug && !candidates.has(slug));
      fallback.sort(compareTies);
      selected.push(...fallback.slice(0, count - selected.length));
    }
    return selected.map((slug) => entries.get(slug)!.proverb);
  };
}

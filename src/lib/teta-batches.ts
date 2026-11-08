import type { ProverbLink } from './catalog';
import { proverbs } from './proverbs';

const batchCount = Math.ceil(proverbs.length / 250);
export const tetaBatches = Array.from({ length: batchCount }, (): ProverbLink[] => []);

for (const [index, { slug, text }] of proverbs.entries()) {
  tetaBatches[index % batchCount].push([slug, text]);
}

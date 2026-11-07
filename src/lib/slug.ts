import { normalize } from './normalize';

/** URL slug derived from a proverb wording. */
export function slugOf(text: string) {
  return normalize(text).split(' ').filter(Boolean).slice(0, 24).join('-').slice(0, 170).replace(/-$/, '') || 'prislovi';
}

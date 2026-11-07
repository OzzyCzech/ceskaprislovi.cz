import { normalize } from './normalize';

export function themeSlug(theme: string) {
  return normalize(theme).replaceAll(' ', '-');
}

export function themePath(theme: string) {
  return `/temata/${themeSlug(theme)}`;
}

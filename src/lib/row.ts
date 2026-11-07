import type { Entry } from './catalog';

const template = document.querySelector<HTMLTemplateElement>('#proverb-row-template');

/** Builds a proverb list row from the shared <template> rendered by RowTemplate.astro. */
export function buildRow([slug, text]: Entry, number?: number) {
  if (!template) throw new Error('Row template is missing');
  const row = template.content.firstElementChild!.cloneNode(true) as HTMLElement;
  row.dataset.proverb = text;
  row.dataset.slug = slug;
  const position = row.querySelector<HTMLElement>('.proverb-row-number')!;
  if (number === undefined) position.remove();
  else position.textContent = String(number).padStart(2, '0');
  const link = row.querySelector<HTMLAnchorElement>('.proverb-row-title')!;
  link.href = `/${slug}`;
  link.textContent = text;
  link.id = `prislovi-${slug}`;
  for (const button of row.querySelectorAll('button')) button.setAttribute('aria-describedby', link.id);
  return row;
}

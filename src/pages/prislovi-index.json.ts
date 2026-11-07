import { proverbs } from '../lib/proverbs';

export function GET() {
  return new Response(JSON.stringify(proverbs.map(({ slug, text, tags, alternatives }) => alternatives?.length ? [slug, text, tags, alternatives] : [slug, text, tags])), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

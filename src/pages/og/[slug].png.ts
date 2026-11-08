import type { APIRoute, GetStaticPaths } from 'astro';
import { renderOgImage } from '../../lib/og-image';
import { proverbs } from '../../lib/proverbs';

export const getStaticPaths = (() => proverbs.map(({ slug, text }) => ({ params: { slug }, props: { text } }))) satisfies GetStaticPaths;

export const GET: APIRoute<{ text: string }> = async ({ props }) => {
  const png = await renderOgImage(props.text);
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};

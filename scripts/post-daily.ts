import { AtpAgent, RichText } from '@atproto/api';
import { dailyIndex, getDailyDate } from '../src/lib/daily';
import { dailyProverbs } from '../src/lib/proverbs';

// Posts today's proverb to Bluesky as a link card pointing at its page, with the Open Graph image as the thumbnail.
// Run via `pnpm post`; set DRY_RUN to print the post without logging in. See README for the scheduling setup.
const site = 'https://ceskaprislovi.cz';
const limit = 300; // Bluesky counts graphemes, not bytes or UTF-16 code units
const segmenter = new Intl.Segmenter('cs', { granularity: 'grapheme' });
const length = (value: string) => [...segmenter.segment(value)].length;

const today = getDailyDate();
const proverb = dailyProverbs[dailyIndex(today.iso, dailyProverbs.length)];
const url = `${site}/${proverb.slug}`;

let text = `Přísloví dne: ${proverb.text}`;
if (proverb.meaning && length(`${text}\n\n${proverb.meaning}`) <= limit) text += `\n\n${proverb.meaning}`;

console.log(`${today.label}\n\n${text}\n\n${url}`);

if (process.env.DRY_RUN) {
  console.error('\nDry run, nothing published.');
  process.exit(0);
}

const handle = process.env.BLUESKY_HANDLE;
const password = process.env.BLUESKY_APP_PASSWORD;
if (!handle || !password) {
  console.error('Set BLUESKY_HANDLE and BLUESKY_APP_PASSWORD in the environment.');
  process.exit(1);
}

const agent = new AtpAgent({ service: 'https://bsky.social' });
await agent.login({ identifier: handle, password });
const did = agent.session!.did;

// Publishing is not idempotent and the workflow can be dispatched more than once a day, so stop if today's post is out.
const { data: feed } = await agent.getAuthorFeed({ actor: did, limit: 20, filter: 'posts_no_replies' });
const postedToday = feed.feed.some(({ post }) => {
  const createdAt = (post.record as { createdAt?: string }).createdAt;
  return post.author.did === did && createdAt !== undefined && getDailyDate(new Date(createdAt)).iso === today.iso;
});
if (postedToday) {
  console.error("\nToday's post already exists, skipping.");
  process.exit(0);
}

async function thumbnail() {
  const response = await fetch(`${site}/og/${proverb.slug}.png`);
  if (!response.ok) return undefined;
  const { data } = await agent.uploadBlob(new Uint8Array(await response.arrayBuffer()), { encoding: 'image/png' });
  return data.blob;
}

const richText = new RichText({ text });
await richText.detectFacets(agent);

await agent.post({
  text: richText.text,
  facets: richText.facets,
  langs: ['cs'],
  embed: {
    $type: 'app.bsky.embed.external',
    external: {
      uri: url,
      title: proverb.text,
      description: proverb.meaning ?? 'Česká přísloví a pořekadla na ceskaprislovi.cz',
      thumb: await thumbnail(),
    },
  },
  createdAt: new Date().toISOString(),
});
console.error(`\nPublished ${url}`);

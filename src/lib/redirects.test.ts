import assert from 'node:assert/strict';
import { test } from 'node:test';
import redirects from '../data/redirects.json';
import { proverbs } from './proverbs';

test('every legacy URL leads directly to an existing canonical proverb', () => {
  const canonical = new Set(proverbs.map(({ slug }) => `/${slug}`));
  for (const [from, to] of Object.entries(redirects)) {
    assert.ok(!canonical.has(from), `Redirect shadows a proverb: ${from}`);
    assert.ok(canonical.has(to), `Missing redirect destination: ${from} → ${to}`);
    assert.ok(!(to in redirects), `Redirect chain: ${from} → ${to}`);
  }
});

test('Search Console examples survive wording edits and merged variants', () => {
  const examples = {
    '/z-blata-do-louze': '/z-blata-do-louze-z-louze-pod-okap',
    '/lenochem-orati-lenositi': '/lenochem-orati',
    '/zubem-sekati-vaditi-se': '/zubem-sekati',
    '/honil-za-sebou-vysekal-se-patama': '/vysekal-se-nam-patami',
    '/spadlo-mu-s-klicky-chybilo-namereni': '/spadlo-mu-to-z-klicky',
    '/az-da-li-buh-vluni-8e2239ad3909': '/az-da-li-buh-vluni',
  };
  for (const [from, to] of Object.entries(examples)) {
    assert.equal(redirects[from as keyof typeof redirects], to);
  }
});

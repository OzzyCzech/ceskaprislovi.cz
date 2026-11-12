import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRelatedProverbs } from './related';
import { proverbs, type Proverb } from './proverbs';

const entry = (slug: string, text: string, tags: string[] = []): Proverb => ({ slug, text, tags });

test('uses all themes and prefers a closer thematic match', () => {
  const source = entry('source', 'Trpělivost růže přináší.', ['čas', 'práce']);
  const first = entry('first', 'Ranní ptáče dál doskáče.', ['čas']);
  const second = entry('second', 'Bez práce nejsou koláče.', ['práce']);
  const both = entry('both', 'Spěchej pomalu.', ['práce', 'čas']);
  const related = createRelatedProverbs([source, first, second, both])(source);
  assert.equal(related[0], both);
  assert.ok(related.includes(second));
});

test('text similarity can find a match across themes and ignores diacritics', () => {
  const source = entry('source', 'Tichá voda břehy mele.', ['povaha']);
  const thematic = entry('thematic', 'Zdání klame.', ['povaha']);
  const textual = entry('textual', 'Ticha voda brehy podemílá.', ['voda']);
  assert.equal(createRelatedProverbs([source, thematic, textual])(source, 1)[0], textual);
});

test('common Czech words do not outweigh meaningful words', () => {
  const source = entry('source', 'Kdo má, ten má zlato.');
  const common = entry('common', 'Kdo má, ten má.');
  const meaningful = entry('meaningful', 'Zlato září.');
  assert.equal(createRelatedProverbs([source, common, meaningful])(source, 1)[0], meaningful);
});

test('ties and sparse fallback are stable across data order, without self-links or duplicates', () => {
  const collection = Array.from({ length: 12 }, (_, i) => entry(`p-${i}`, 'A kdo se má.', i < 6 ? ['čas'] : []));
  const forward = createRelatedProverbs(collection);
  const reverse = createRelatedProverbs([...collection].reverse());
  for (const source of collection) {
    const result = forward(source);
    assert.deepEqual(result, reverse(source));
    assert.equal(result.length, 3);
    assert.equal(new Set(result.map(({ slug }) => slug)).size, 3);
    assert.ok(result.every(({ slug }) => slug !== source.slug));
  }
  assert.notDeepEqual(forward(collection[6]), forward(collection[7]));
  assert.deepEqual(forward(collection[0], 0), []);
  assert.deepEqual(createRelatedProverbs([collection[0]])(collection[0]), []);
  assert.deepEqual(createRelatedProverbs([])(collection[0]), []);
});

test('the whole collection has three distinct, valid onward links per detail', () => {
  const related = createRelatedProverbs(proverbs);
  const slugs = new Set(proverbs.map(({ slug }) => slug));
  for (const source of proverbs) {
    const result = related(source);
    assert.equal(result.length, 3, source.slug);
    assert.equal(new Set(result.map(({ slug }) => slug)).size, 3, source.slug);
    assert.ok(result.every(({ slug }) => slug !== source.slug && slugs.has(slug)), source.slug);
  }
});

import { afterAll, describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  normalizeCategory,
  parseCsv,
  readCatalogue,
} from '../scripts/lib/catalogue-csv';

const dir = mkdtempSync(join(tmpdir(), 'catalogue-'));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

function csvFile(body: string): string {
  const path = join(dir, `${Math.random().toString(36).slice(2)}.csv`);
  writeFileSync(path, body);
  return path;
}

const HEADER =
  'Product Category,Product Subcategory,Product Name,Product Price,Product Rating,Total Ratings,Product Image';

describe('parseCsv', () => {
  test('splits plain rows', () => {
    expect(parseCsv('a,b\nc,d\n')).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ]);
  });

  test('a quoted comma stays inside its field', () => {
    expect(parseCsv('"Shoes, Blue",9\n')).toEqual([['Shoes, Blue', '9']]);
  });

  test('a doubled quote is one literal quote', () => {
    expect(parseCsv('"6"" ruler",1\n')).toEqual([['6" ruler', '1']]);
  });

  test('a newline inside quotes does not end the row', () => {
    expect(parseCsv('"line1\nline2",x\n')).toEqual([['line1\nline2', 'x']]);
  });

  test('CRLF endings do not leak a stray carriage return', () => {
    expect(parseCsv('a,b\r\nc,d\r\n')).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ]);
  });

  test('a final row without a trailing newline is still read', () => {
    expect(parseCsv('a,b\nc,d')).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ]);
  });
});

describe('normalizeCategory', () => {
  test('the three art spellings collapse to one aisle', () => {
    expect(normalizeCategory('Art & Craft')).toBe('Arts & Crafts');
    expect(normalizeCategory('Art Supplies')).toBe('Arts & Crafts');
    expect(normalizeCategory('Arts & Crafts')).toBe('Arts & Crafts');
  });

  test('an unlisted category is left alone', () => {
    expect(normalizeCategory('Electronics')).toBe('Electronics');
  });
});

describe('readCatalogue', () => {
  const row = (over: Partial<Record<string, string>> = {}) =>
    [
      over.category ?? 'Toys',
      over.subcategory ?? 'Puzzles',
      over.name ?? 'Wooden Puzzle',
      over.price ?? '$12.50',
      over.rating ?? '4.2',
      over.total ?? '87',
      over.image ?? 'https://m.media-amazon.com/images/I/abc._AC_UL320_.jpg',
    ].join(',');

  test('reads a row and normalises its category', () => {
    const [product] = readCatalogue(csvFile(`${HEADER}\n${row()}\n`));
    expect(product).toMatchObject({
      category: 'Toys & Games',
      subcategory: 'Puzzles',
      name: 'Wooden Puzzle',
      price: 12.5,
      rating: 4.2,
      totalRatings: 87,
    });
  });

  // The bug that shipped: the rewrite matched _AC_UY218_ but not _AC_UL320_,
  // so 39k rows silently kept thumbnail-sized images.
  test.each([
    ['_AC_UL320_', 'https://x/i/a._AC_UL320_.jpg'],
    ['_AC_UY218_', 'https://x/i/a._AC_UY218_.jpg'],
    ['_AC_UX679_', 'https://x/i/a._AC_UX679_.jpg'],
  ])('%s is rewritten to a full-size image', (_label, image) => {
    const [product] = readCatalogue(csvFile(`${HEADER}\n${row({ image })}\n`));
    expect(product.imageUrl).toContain('_AC_UL600_');
    expect(product.imageUrl).not.toContain('_AC_UL320_');
  });

  test('a URL with no size marker is left untouched', () => {
    const image = 'https://x/i/plain.jpg';
    const [product] = readCatalogue(csvFile(`${HEADER}\n${row({ image })}\n`));
    expect(product.imageUrl).toBe(image);
  });

  test('strips currency formatting from the price', () => {
    const [product] = readCatalogue(
      csvFile(`${HEADER}\n${row({ price: '"$1,299.00"' })}\n`),
    );
    expect(product.price).toBe(1299);
  });

  test.each([
    ['no name', { name: '' }],
    ['no category', { category: '' }],
    ['a non-http image', { image: 'not-a-url' }],
    ['an unparseable price', { price: 'N/A' }],
    ['a zero price', { price: '$0' }],
  ])('drops a row with %s', (_label, over) => {
    expect(readCatalogue(csvFile(`${HEADER}\n${row(over)}\n`))).toEqual([]);
  });

  test('a missing subcategory falls back to General', () => {
    const [product] = readCatalogue(
      csvFile(`${HEADER}\n${row({ subcategory: '' })}\n`),
    );
    expect(product.subcategory).toBe('General');
  });

  test('keeps the good rows when a bad one sits between them', () => {
    const body = [
      HEADER,
      row({ name: 'First' }),
      row({ price: 'N/A' }),
      row({ name: 'Third' }),
    ].join('\n');
    expect(readCatalogue(csvFile(body)).map((p) => p.name)).toEqual([
      'First',
      'Third',
    ]);
  });
});

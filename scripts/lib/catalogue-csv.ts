import { readFileSync } from 'node:fs';

export interface CsvProduct {
  category: string;
  subcategory: string;
  name: string;
  price: number;
  rating: number;
  totalRatings: number;
  imageUrl: string;
}

// The source data labels one aisle several ways ("Art & Craft" / "Arts & Crafts"
// / "Art Supplies"), so the nav would otherwise show three entries for it.
const CATEGORY_ALIASES: Record<string, string> = {
  Toys: 'Toys & Games',
  'Art & Craft': 'Arts & Crafts',
  'Art Supplies': 'Arts & Crafts',
  'Beauty & Personal': 'Beauty & Personal Care',
  'Healthcare & Wellness': 'Health & Household',
  Music: 'Musical Instruments',
  'Music Instruments': 'Musical Instruments',
  'Gardening & Outdoor': 'Garden & Outdoor',
};

export function normalizeCategory(raw: string): string {
  return CATEGORY_ALIASES[raw] ?? raw;
}

/** Minimal RFC4180 reader: product names contain both commas and quotes. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') quoted = true;
    else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (char !== '\r') {
      field += char;
    }
  }

  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

export function readCatalogue(path: string): CsvProduct[] {
  const rows = parseCsv(readFileSync(path, 'utf-8'));
  const header = rows[0];
  const col = (name: string) => header.indexOf(name);

  const iCat = col('Product Category');
  const iSub = col('Product Subcategory');
  const iName = col('Product Name');
  const iPrice = col('Product Price');
  const iRating = col('Product Rating');
  const iTotal = col('Total Ratings');
  const iImage = col('Product Image');

  const out: CsvProduct[] = [];
  for (const row of rows.slice(1)) {
    const name = (row[iName] ?? '').trim();
    const category = (row[iCat] ?? '').trim();
    const image = (row[iImage] ?? '').trim();
    const price = Number((row[iPrice] ?? '').replace(/[$,\s]/g, ''));

    if (
      !name ||
      !category ||
      !image.startsWith('http') ||
      !Number.isFinite(price) ||
      price <= 0
    ) {
      continue;
    }

    out.push({
      category: normalizeCategory(category),
      subcategory: (row[iSub] ?? '').trim() || 'General',
      name,
      price,
      rating: Number(row[iRating]) || 4.5,
      totalRatings: Number(row[iTotal]) || 0,
      // The source ships 218px thumbnails; the storefront renders much larger.
      imageUrl: image.replace(/_AC_U[A-Z]\d+_/, '_AC_UL600_'),
    });
  }
  return out;
}

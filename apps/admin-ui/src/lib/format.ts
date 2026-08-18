import currency from 'currency.js';

export const CURRENCY = 'USD';

export const MONEY_PATTERN = /^\d+(\.\d{1,2})?$/;
export const INTEGER_PATTERN = /^\d+$/;

export const money = (value: currency.Any) =>
  currency(value, { symbol: '$', precision: 2 });

export function formatMoney(value: currency.Any) {
  return money(value).format();
}

/** Keeps digits and a single decimal point, capped at two places. */
export function clampDecimal(raw: string) {
  const cleaned = raw.replace(/[^\d.]/g, '');
  const [whole, ...rest] = cleaned.split('.');
  return rest.length ? `${whole}.${rest.join('').slice(0, 2)}` : whole;
}

/** Truncates at a decimal point rather than splicing digits: "3.5" -> "3". */
export function clampInteger(raw: string) {
  return raw.replace(/[^\d.]/g, '').split('.')[0];
}

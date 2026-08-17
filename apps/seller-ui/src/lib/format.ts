export const CURRENCY = 'USD';
export const LOCALE = 'en-US';

/** Up to two decimals, no sign, no exponent. */
export const MONEY_PATTERN = /^\d+(\.\d{1,2})?$/;
export const INTEGER_PATTERN = /^\d+$/;

export function formatMoney(amount: number) {
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: CURRENCY,
  }).format(amount);
}

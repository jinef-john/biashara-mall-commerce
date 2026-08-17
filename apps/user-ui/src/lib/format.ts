import { CURRENCY } from '@biashara-mall/config';

const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: CURRENCY,
  maximumFractionDigits: 2,
});

export function formatPrice(amount: number): string {
  return formatter.format(amount);
}

'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

function csv(value: string | null): string[] {
  return value ? value.split(',').filter(Boolean) : [];
}

/**
 * Filter state lives entirely in the URL — so a filtered listing can be
 * bookmarked or shared — rather than in component state.
 */
export function useProductFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const categories = csv(searchParams.get('categories'));
  const colors = csv(searchParams.get('colors'));
  const sizes = csv(searchParams.get('sizes'));
  const q = searchParams.get('q') ?? '';
  const page = Number(searchParams.get('page')) || 1;
  const priceMin = searchParams.get('priceMin');
  const priceMax = searchParams.get('priceMax');
  const priceRange: [number | null, number | null] = [
    priceMin ? Number(priceMin) : null,
    priceMax ? Number(priceMax) : null,
  ];

  /** Any patch besides an explicit page change resets pagination to page 1. */
  function update(patch: Record<string, string | string[] | null>) {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(patch)) {
      const empty = value == null || value === '' || (Array.isArray(value) && value.length === 0);
      if (empty) {
        params.delete(key);
      } else {
        params.set(key, Array.isArray(value) ? value.join(',') : value);
      }
    }
    if (!('page' in patch)) params.delete('page');

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function toggle(key: 'categories' | 'colors' | 'sizes', value: string) {
    const current = key === 'categories' ? categories : key === 'colors' ? colors : sizes;
    update({
      [key]: current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value],
    });
  }

  function clear() {
    router.replace(pathname, { scroll: false });
  }

  const hasFilters =
    categories.length > 0 ||
    colors.length > 0 ||
    sizes.length > 0 ||
    priceRange[0] != null ||
    priceRange[1] != null;

  return { categories, colors, sizes, q, page, priceRange, update, toggle, clear, hasFilters };
}

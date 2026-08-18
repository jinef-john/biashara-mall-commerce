const BASE_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL;

/**
 * Fetch helper for server components (product/[slug] and shop/[id] need
 * data before render for generateMetadata), a plain `fetch`, not the axios
 * `publicApi` instance, since that file is `'use client'`.
 */
export async function serverGet<T>(path: string): Promise<T | null> {
  const res = await fetch(`${BASE_URL}${path}`, { next: { revalidate: 60 } });
  if (!res.ok) return null;
  return res.json();
}

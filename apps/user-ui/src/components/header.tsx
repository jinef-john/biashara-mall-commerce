'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { SignInButton, SignUpButton, Show, UserButton } from '@clerk/nextjs';
import { Heart, MapPin, Search, ShoppingCart, Store } from 'lucide-react';
import { Button } from '@biashara-mall/ui/components/ui/button';
import { Input } from '@biashara-mall/ui/components/ui/input';
import { useSiteConfig } from '../lib/use-site-config';
import { useStore } from '../store';
import { useHydrated } from '../lib/use-hydrated';
import { HeaderBottom } from './header-bottom';

const SELLER_URL = process.env.NEXT_PUBLIC_SELLER_URL ?? 'http://localhost:3001';

function CountBadge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-on-primary tabular-nums">
      {count > 9 ? '9+' : count}
    </span>
  );
}

export function Header() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const { data: config } = useSiteConfig();

  // localStorage-backed counts would mismatch the server render on first paint.
  const hydrated = useHydrated();
  const cartCount = useStore((s) => s.cart.length);
  const wishlistCount = useStore((s) => s.wishlist.length);

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/products?q=${encodeURIComponent(q)}` : '/products');
  };

  return (
    <>
      <header className="border-b border-outline-variant bg-surface-container-lowest">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-4 md:flex-nowrap">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            {config?.logoUrl ? (
              <Image
                src={config.logoUrl}
                alt="Biashara Mall"
                width={140}
                height={32}
                className="h-8 w-auto"
                priority
              />
            ) : (
              <span className="text-headline-sm text-on-surface">
                Biashara Mall
              </span>
            )}
          </Link>

          <form onSubmit={search} className="order-last flex w-full md:order-none md:flex-1">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for products, brands and shops"
              aria-label="Search"
              className="flex-1 rounded-r-none rounded-l-full border-r-0"
            />
            <Button type="submit" size="icon" className="rounded-l-none rounded-r-full" aria-label="Search">
              <Search />
            </Button>
          </form>

          <div className="ml-auto flex shrink-0 items-center gap-1 md:ml-0">
            <Button asChild variant="ghost" className="hidden lg:inline-flex">
              <a href={SELLER_URL}>
                <Store />
                Become a seller
              </a>
            </Button>

            <Button asChild variant="ghost" size="icon" className="relative">
              <Link href="/wishlist" aria-label="Wishlist">
                <Heart />
                {hydrated && <CountBadge count={wishlistCount} />}
              </Link>
            </Button>

            <Button asChild variant="ghost" size="icon" className="relative">
              <Link href="/cart" aria-label="Cart">
                <ShoppingCart />
                {hydrated && <CountBadge count={cartCount} />}
              </Link>
            </Button>

            <Show when="signed-out">
              <SignInButton mode="modal">
                <Button variant="ghost">Sign in</Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button>Sign up</Button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <Button asChild variant="ghost" size="icon" aria-label="Profile">
                <Link href="/profile">
                  <MapPin />
                </Link>
              </Button>
              <div className="pl-2">
                <UserButton />
              </div>
            </Show>
          </div>
        </div>
      </header>

      <HeaderBottom />
    </>
  );
}

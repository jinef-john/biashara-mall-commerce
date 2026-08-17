'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ChevronDown, LayoutGrid } from 'lucide-react';
import { Button } from '@biashara-mall/ui/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@biashara-mall/ui/components/ui/dropdown-menu';
import { useSiteConfig } from '../lib/use-site-config';

const NAV = [
  { label: 'Home', href: '/' },
  { label: 'Products', href: '/products' },
  { label: 'Shops', href: '/shops' },
  { label: 'Offers', href: '/offers' },
];

export function HeaderBottom() {
  const pathname = usePathname();
  const { data: config } = useSiteConfig();
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 100);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    // A spacer keeps the page from jumping when the bar leaves the flow.
    <div className={stuck ? 'h-14' : undefined}>
      <div
        className={
          stuck
            ? 'fixed inset-x-0 top-0 z-50 border-b border-outline-variant bg-surface-container-lowest shadow-md'
            : 'border-b border-outline-variant bg-surface-container-lowest'
        }
      >
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" className="shrink-0">
                <LayoutGrid />
                All departments
                <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {(config?.categories ?? []).map((category) => (
                <DropdownMenuItem key={category} asChild>
                  <Link
                    href={`/products?categories=${encodeURIComponent(category)}`}
                  >
                    {category}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <nav className="flex items-center gap-1 overflow-x-auto">
            {NAV.map((item) => (
              <Button
                key={item.href}
                asChild
                variant="ghost"
                className={
                  pathname === item.href
                    ? 'text-primary'
                    : 'text-on-surface-variant'
                }
              >
                <Link href={item.href}>{item.label}</Link>
              </Button>
            ))}
          </nav>

          {stuck && (
            <Link
              href="/"
              className="ml-auto hidden text-headline-sm text-on-surface md:block"
            >
              Biashara Mall
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

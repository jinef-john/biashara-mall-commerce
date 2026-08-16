'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  {
    title: 'Products',
    items: [
      { label: 'Create Product', href: '/dashboard/create-product' },
      { label: 'All Products', href: '/dashboard/all-products' },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 border-r border-outline-variant bg-surface-container-lowest px-4 py-6">
      {NAV.map((group) => (
        <div key={group.title} className="mb-6">
          <p className="mb-2 text-label-sm uppercase text-on-surface-variant">
            {group.title}
          </p>
          <nav className="flex flex-col gap-1">
            {group.items.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded px-4 py-2 text-body-sm ${
                    active
                      ? 'bg-primary-container text-on-primary-container'
                      : 'text-on-surface hover:bg-surface-container'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      ))}
    </aside>
  );
}

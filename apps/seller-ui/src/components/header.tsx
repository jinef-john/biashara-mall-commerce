'use client';

import Image from 'next/image';
import Link from 'next/link';
import { SignInButton, SignUpButton, Show, UserButton, useAuth } from '@clerk/nextjs';
import { Bell } from 'lucide-react';
import { Button } from '@biashara-mall/ui/components/ui/button';
import { Badge } from '@biashara-mall/ui/components/ui/badge';
import { useLayout } from '../lib/use-layout';
import { useNotifications } from '../lib/use-notifications';

function CountBadge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-on-primary tabular-nums">
      {count > 9 ? '9+' : count}
    </span>
  );
}

export function Header({ leading }: { leading?: React.ReactNode }) {
  const { data: layout } = useLayout();
  const { isSignedIn } = useAuth();
  const { data: notifications } = useNotifications({ enabled: isSignedIn });
  const unreadCount = notifications?.filter((n) => n.status === 'unread').length ?? 0;

  return (
    <header className="sticky top-0 z-50 flex h-(--header-height) shrink-0 items-center justify-between border-b border-outline-variant bg-surface-container-lowest px-4">
      <div className="flex items-center gap-3">
        {leading}
        {layout?.logoUrl ? (
          <>
            <Image
              src={layout.logoUrl}
              alt="Biashara Mall"
              width={140}
              height={32}
              className="h-8 w-auto"
              priority
            />
            <Badge variant="secondary">Seller</Badge>
          </>
        ) : (
          <span className="text-headline-sm text-on-surface">
            Biashara Mall * Seller
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Show when="signed-out">
          <SignInButton mode="modal">
            <Button variant="ghost">Sign in</Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button>Create shop</Button>
          </SignUpButton>
        </Show>
        <Show when="signed-in">
          <Button asChild variant="ghost" size="icon" className="relative" aria-label="Notifications">
            <Link href="/dashboard/notifications">
              <Bell />
              <CountBadge count={unreadCount} />
            </Link>
          </Button>
          <UserButton />
        </Show>
      </div>
    </header>
  );
}

'use client';

import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@biashara-mall/ui/components/ui/button';
import { useIsSuspended } from '../../lib/use-me';

export function SuspendedGate({ children }: { children: React.ReactNode }) {
  const suspended = useIsSuspended();
  if (!suspended) return <>{children}</>;

  return (
    <main className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-16 text-center">
      <ShieldAlert className="size-8 text-error" />
      <h1 className="text-headline-sm text-on-surface">
        Not available while your account is suspended
      </h1>
      <p className="text-body-md text-on-surface-variant">
        Your past orders are still available.
      </p>
      <Button asChild variant="outline">
        <Link href="/profile">View your orders</Link>
      </Button>
    </main>
  );
}

'use client';

import { ShieldAlert } from 'lucide-react';
import { useIsSuspended } from '../../lib/use-me';

export function SuspendedBanner() {
  const suspended = useIsSuspended();
  if (!suspended) return null;

  return (
    <div className="flex items-start gap-3 border-b border-error/30 bg-error-container px-4 py-3 text-on-error-container">
      <ShieldAlert className="mt-0.5 size-5 shrink-0" />
      <div className="text-body-sm">
        <p className="font-medium">This account is suspended</p>
        <p>
          You can still view your past orders, but you cannot buy, message
          sellers, or use the cart and wishlist. Contact support if you think
          this is a mistake.
        </p>
      </div>
    </div>
  );
}

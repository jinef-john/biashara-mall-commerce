'use client';

import { useEffect, useState } from 'react';

function label(target: Date): string {
  const ms = target.getTime() - Date.now();
  if (ms <= 0) return 'Expired';

  const totalMinutes = Math.floor(ms / 60_000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/** Live "Xd Yh" / "Expired" label for an event's end date. Minute-granularity, so a 1min tick is enough. */
export function useCountdown(target: Date | null): string | null {
  const [text, setText] = useState<string | null>(target ? label(target) : null);

  useEffect(() => {
    if (!target) {
      setText(null);
      return;
    }
    setText(label(target));
    const id = setInterval(() => setText(label(target)), 60_000);
    return () => clearInterval(id);
  }, [target?.getTime()]);

  return text;
}

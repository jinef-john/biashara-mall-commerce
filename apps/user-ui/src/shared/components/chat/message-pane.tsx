'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@biashara-mall/ui/components/ui/button';
import type { ChatMessage } from '../../../context/web-socket-context';

export function MessagePane({
  messages,
  hasMore,
  loading,
  onLoadPrevious,
  isOwn,
}: {
  messages: ChatMessage[];
  hasMore: boolean;
  loading: boolean;
  onLoadPrevious: () => void;
  isOwn: (message: ChatMessage) => boolean;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const latestId = messages[messages.length - 1]?.createdAt;

  // Only on a new latest message, so loading older pages doesn't yank the
  // reader back down to the bottom.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [latestId]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3">
      {hasMore && (
        <div className="mb-3 flex justify-center">
          <Button type="button" variant="outline" size="sm" onClick={onLoadPrevious} disabled={loading}>
            {loading ? 'Loading…' : 'Load previous messages'}
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {messages.map((message) => {
          const own = isOwn(message);
          return (
            <div
              key={`${message.createdAt}-${message.senderId}`}
              className={own ? 'flex justify-end' : 'flex justify-start'}
            >
              <div
                className={
                  own
                    ? 'max-w-[75%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-on-primary'
                    : 'max-w-[75%] rounded-2xl rounded-bl-sm bg-surface-container px-3 py-2 text-on-surface'
                }
              >
                <p className="text-body-md whitespace-pre-wrap break-words">{message.content}</p>
                <p className={own ? 'text-body-sm text-on-primary/70' : 'text-body-sm text-on-surface-variant'}>
                  {new Date(message.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <div ref={bottomRef} />
    </div>
  );
}

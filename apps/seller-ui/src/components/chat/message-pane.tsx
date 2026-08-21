'use client';

import { User } from 'lucide-react';
import { Button } from '@biashara-mall/ui/components/ui/button';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@biashara-mall/ui/components/ui/avatar';
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageGroup,
} from '@biashara-mall/ui/components/ui/message';
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from '@biashara-mall/ui/components/ui/message-scroller';
import type { ChatMessage } from '../../context/web-socket-context';

export interface Counterpart {
  name: string;
  avatarUrl?: string | null;
}

function timeOf(createdAt: string) {
  return new Date(createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function MessagePane({
  messages,
  hasMore,
  loading,
  onLoadPrevious,
  isOwn,
  counterpart,
}: {
  messages: ChatMessage[];
  hasMore: boolean;
  loading: boolean;
  onLoadPrevious: () => void;
  isOwn: (message: ChatMessage) => boolean;
  counterpart: Counterpart;
}) {
  return (
    <MessageScrollerProvider>
      <MessageScroller className="min-h-0 flex-1">
        <MessageScrollerViewport className="px-4 py-4">
          <MessageScrollerContent className="gap-4">
            {hasMore && (
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onLoadPrevious}
                  disabled={loading}
                >
                  {loading ? 'Loading…' : 'Load previous messages'}
                </Button>
              </div>
            )}

            {messages.length === 0 && !loading && (
              <p className="m-auto text-center text-sm text-muted-foreground">
                No messages yet. Say hello to get the conversation started.
              </p>
            )}

            <MessageGroup className="gap-4">
              {messages.map((message, index) => {
                const own = isOwn(message);
                return (
                  <MessageScrollerItem
                    key={`${message.createdAt}-${message.senderId}`}
                    scrollAnchor={index === messages.length - 1}
                  >
                    <Message align={own ? 'end' : 'start'}>
                      <MessageAvatar>
                        <Avatar className="size-8">
                          {!own && counterpart.avatarUrl && (
                            <AvatarImage src={counterpart.avatarUrl} alt="" />
                          )}
                          <AvatarFallback
                            className={own ? 'bg-primary/10 text-primary' : undefined}
                          >
                            {own ? (
                              <User className="size-4" />
                            ) : (
                              counterpart.name.slice(0, 1).toUpperCase()
                            )}
                          </AvatarFallback>
                        </Avatar>
                      </MessageAvatar>
                      <MessageContent>
                        <div
                          className={
                            own
                              ? 'w-fit max-w-[80%] rounded-2xl rounded-tr-none bg-primary px-4 py-2 text-primary-foreground shadow-sm'
                              : 'w-fit max-w-[80%] rounded-2xl rounded-tl-none border border-border bg-card px-4 py-2 text-card-foreground shadow-sm'
                          }
                        >
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        </div>
                        <MessageFooter>{timeOf(message.createdAt)}</MessageFooter>
                      </MessageContent>
                    </Message>
                  </MessageScrollerItem>
                );
              })}
            </MessageGroup>
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton />
      </MessageScroller>
    </MessageScrollerProvider>
  );
}

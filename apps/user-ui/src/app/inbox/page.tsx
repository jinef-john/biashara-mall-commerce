'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MessagesSquare, Store } from 'lucide-react';
import { useApi } from '../../lib/api';
import { useMe } from '../../lib/use-me';
import { useWebSocket } from '../../context/web-socket-context';
import { useConversation } from '../../shared/hooks/use-conversation';
import { ChatInput } from '../../shared/components/chat/chat-input';
import { MessagePane } from '../../shared/components/chat/message-pane';
import {
  ProductContextCard,
  type ProductContext,
} from '../../shared/components/chat/product-context-card';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@biashara-mall/ui/components/ui/avatar';
import { Badge } from '@biashara-mall/ui/components/ui/badge';
import { Button } from '@biashara-mall/ui/components/ui/button';
import { NotificationListSkeleton } from '../../shared/components/skeletons';

interface Conversation {
  id: string;
  updatedAt: string;
  unreadCount: number;
  lastMessage: { content: string; createdAt: string } | null;
  product: ProductContext | null;
  shop: { id: string; name: string; logoUrl: string | null; isOnline: boolean } | null;
}

function ShopAvatar({
  shop,
  className,
}: {
  shop: { name: string; logoUrl: string | null; isOnline: boolean } | null;
  className?: string;
}) {
  return (
    <div className="relative shrink-0">
      <Avatar className={className ?? 'size-9'}>
        {shop?.logoUrl && <AvatarImage src={shop.logoUrl} alt="" />}
        <AvatarFallback>
          {shop?.name ? (
            shop.name.slice(0, 1).toUpperCase()
          ) : (
            <Store className="size-4 text-muted-foreground" />
          )}
        </AvatarFallback>
      </Avatar>
      {shop?.isOnline && (
        <span className="absolute right-0 bottom-0 size-2.5 rounded-full bg-green-500 ring-2 ring-background" />
      )}
    </div>
  );
}

function Inbox() {
  const api = useApi();
  const params = useSearchParams();
  const { data: me } = useMe();
  const queryClient = useQueryClient();
  const { unreadCounts, sendMessage, markAsSeen, ready, subscribe } = useWebSocket();
  const [activeId, setActiveId] = useState<string | null>(params.get('c'));

  const {
    data: conversations,
    isPending,
    isError,
    refetch,
  } = useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: async () => {
      const { data } = await api.get('/chatting/api/get-user-conversations');
      return data.conversations;
    },
  });

  const active = conversations?.find((c) => c.id === activeId) ?? null;
  const { messages, hasMore, loading, loadPrevious } = useConversation(
    activeId,
    '/chatting/api/get-messages',
  );

  useEffect(() => {
    if (activeId && ready) markAsSeen(activeId);
  }, [activeId, ready, markAsSeen, messages.length]);

  // Without this the previews and the ordering stay frozen at page load.
  useEffect(
    () =>
      subscribe((message) => {
        queryClient.setQueryData<Conversation[]>(['conversations'], (current) => {
          if (!current) return current;
          if (!current.some((c) => c.id === message.conversationId)) {
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            return current;
          }
          return current
            .map((c) =>
              c.id === message.conversationId
                ? {
                    ...c,
                    updatedAt: message.createdAt,
                    lastMessage: {
                      content: message.content,
                      createdAt: message.createdAt,
                    },
                  }
                : c,
            )
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
        });
      }),
    [subscribe, queryClient],
  );

  return (
    <main className="mx-auto flex h-[calc(100dvh-var(--header-height,8rem))] max-w-6xl gap-4 px-4 py-4">
      <aside className="flex w-72 shrink-0 flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
        <h1 className="shrink-0 border-b border-outline-variant px-4 py-3 text-title-md text-on-surface">
          Messages
        </h1>
        {isPending ? (
          <div className="p-3">
            <NotificationListSkeleton rows={4} />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-start gap-2 p-4">
            <p className="text-body-sm text-on-surface-variant">
              Could not load conversations.
            </p>
            <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : (conversations?.length ?? 0) === 0 ? (
          <p className="p-4 text-body-sm text-on-surface-variant">
            No conversations yet. Message a shop from any product page.
          </p>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            {conversations!.map((conversation) => {
              const unread = unreadCounts[conversation.id] ?? conversation.unreadCount;
              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => setActiveId(conversation.id)}
                  className={
                    conversation.id === activeId
                      ? 'flex items-center gap-3 border-b border-outline-variant bg-primary-container/40 px-4 py-3 text-left'
                      : 'flex items-center gap-3 border-b border-outline-variant px-4 py-3 text-left hover:bg-surface-container-low'
                  }
                >
                  <ShopAvatar shop={conversation.shop} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p
                        className={
                          unread > 0
                            ? 'truncate text-body-md font-medium text-on-surface'
                            : 'truncate text-body-md text-on-surface'
                        }
                      >
                        {conversation.shop?.name ?? 'Shop'}
                      </p>
                      {unread > 0 && (
                        <span
                          className="size-2 shrink-0 rounded-full bg-primary"
                          aria-label="Unread messages"
                        />
                      )}
                    </div>
                    <p
                      className={
                        unread > 0
                          ? 'truncate text-body-sm font-medium text-on-surface'
                          : 'truncate text-body-sm text-on-surface-variant'
                      }
                    >
                      {conversation.lastMessage?.content ?? 'No messages yet'}
                    </p>
                  </div>
                  {unread > 0 && (
                    <Badge className="shrink-0 tabular-nums">
                      {unread > 9 ? '9+' : unread}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </aside>

      <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
        {!active ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <MessagesSquare className="size-8 text-on-surface-variant" />
            <p className="text-body-lg text-on-surface">Select a conversation</p>
          </div>
        ) : (
          <>
            <div className="flex shrink-0 items-center gap-3 bg-primary px-4 py-3 text-on-primary">
              <ShopAvatar shop={active.shop} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-title-sm">{active.shop?.name}</p>
                <p className="text-body-sm text-on-primary/80">
                  {active.shop?.isOnline ? 'Online' : 'Offline'}
                </p>
              </div>
              {active.shop && (
                <Link
                  href={`/shop/${active.shop.id}`}
                  className="shrink-0 text-body-sm text-on-primary/80 underline-offset-4 hover:underline"
                >
                  Visit shop
                </Link>
              )}
            </div>

            {active.product && (
              <ProductContextCard product={active.product} label="Asking about" />
            )}

            <MessagePane
              counterpart={{
                name: active.shop?.name ?? 'Shop',
                avatarUrl: active.shop?.logoUrl,
              }}
              messages={messages}
              hasMore={hasMore}
              loading={loading}
              onLoadPrevious={loadPrevious}
              isOwn={(message) => message.senderId === me?.id}
            />

            <ChatInput
              disabled={!ready}
              onSend={(body) =>
                active.shop &&
                sendMessage({
                  conversationId: active.id,
                  toUserId: active.shop.id,
                  messageBody: body,
                })
              }
            />
          </>
        )}
      </section>
    </main>
  );
}

export default function InboxPage() {
  return (
    <Suspense fallback={null}>
      <Inbox />
    </Suspense>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessagesSquare, User } from 'lucide-react';
import { useApi } from '../../../lib/api';
import { useConversation } from '../../../lib/use-conversation';
import { useWebSocket } from '../../../context/web-socket-context';
import { ChatInput } from '../../../components/chat/chat-input';
import { MessagePane } from '../../../components/chat/message-pane';
import {
  ProductContextCard,
  type ProductContext,
} from '../../../components/chat/product-context-card';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@biashara-mall/ui/components/ui/avatar';
import { Badge } from '@biashara-mall/ui/components/ui/badge';
import { Button } from '@biashara-mall/ui/components/ui/button';
import { ListSkeleton } from '../../../components/skeletons';

interface Conversation {
  id: string;
  updatedAt: string;
  unreadCount: number;
  lastMessage: { content: string; createdAt: string } | null;
  product: ProductContext | null;
  user: { id: string; name: string | null; avatarUrl: string | null; isOnline: boolean } | null;
}

function BuyerAvatar({
  user,
  className,
}: {
  user: { name: string | null; avatarUrl: string | null; isOnline: boolean } | null;
  className?: string;
}) {
  return (
    <div className="relative shrink-0">
      <Avatar className={className ?? 'size-9'}>
        {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
        <AvatarFallback>
          {user?.name ? (
            user.name.slice(0, 1).toUpperCase()
          ) : (
            <User className="size-4 text-muted-foreground" />
          )}
        </AvatarFallback>
      </Avatar>
      {user?.isOnline && (
        <span className="absolute right-0 bottom-0 size-2.5 rounded-full bg-green-500 ring-2 ring-background" />
      )}
    </div>
  );
}

export default function InboxPage() {
  const api = useApi();
  const { unreadCounts, sendMessage, markAsSeen, ready } = useWebSocket();
  const [activeId, setActiveId] = useState<string | null>(null);

  const { data: shop } = useQuery<{ id: string } | null>({
    queryKey: ['shop-me'],
    queryFn: async () => {
      const { data } = await api.get('/seller/api/shops/me');
      return data.shop;
    },
    staleTime: 60_000,
  });

  const {
    data: conversations,
    isPending,
    isError,
    refetch,
  } = useQuery<Conversation[]>({
    queryKey: ['seller-conversations'],
    queryFn: async () => {
      const { data } = await api.get('/chatting/api/get-seller-conversations');
      return data.conversations;
    },
  });

  const active = conversations?.find((c) => c.id === activeId) ?? null;
  const { messages, hasMore, loading, loadPrevious } = useConversation(
    activeId,
    '/chatting/api/get-seller-messages',
  );

  useEffect(() => {
    if (activeId && ready) markAsSeen(activeId);
  }, [activeId, ready, markAsSeen, messages.length]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-headline-lg text-on-surface">Inbox</h1>
        <p className="text-body-md text-on-surface-variant">
          Messages from buyers about your products.
        </p>
      </div>

      <div className="flex h-[calc(100dvh-13rem)] min-h-[28rem] gap-4">
        <aside className="flex w-72 shrink-0 flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
          {isPending ? (
            <div className="p-3">
              <ListSkeleton rows={4} />
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
              No conversations yet. Buyers can message you from your product pages.
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
                    <BuyerAvatar user={conversation.user} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-body-md text-on-surface">
                        {conversation.user?.name ?? 'Customer'}
                      </p>
                      <p className="truncate text-body-sm text-on-surface-variant">
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
                <BuyerAvatar user={active.user} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-title-sm">
                    {active.user?.name ?? 'Customer'}
                  </p>
                  <p className="text-body-sm text-on-primary/80">
                    {active.user?.isOnline ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>

              {active.product && (
                <ProductContextCard product={active.product} label="Asking about" />
              )}

              <MessagePane
                counterpart={{
                  name: active.user?.name ?? 'Customer',
                  avatarUrl: active.user?.avatarUrl,
                }}
                messages={messages}
                hasMore={hasMore}
                loading={loading}
                onLoadPrevious={loadPrevious}
                isOwn={(message) => message.senderId === shop?.id}
              />

              <ChatInput
                disabled={!ready}
                onSend={(body) =>
                  active.user &&
                  sendMessage({
                    conversationId: active.id,
                    toUserId: active.user.id,
                    messageBody: body,
                  })
                }
              />
            </>
          )}
        </section>
      </div>
    </div>
  );
}

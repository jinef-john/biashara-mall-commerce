'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessagesSquare, User } from 'lucide-react';
import { useApi } from '../../../lib/api';
import { useConversation } from '../../../lib/use-conversation';
import { useWebSocket } from '../../../context/web-socket-context';
import { ChatInput } from '../../../components/chat/chat-input';
import { MessagePane } from '../../../components/chat/message-pane';
import { ListSkeleton } from '../../../components/skeletons';

interface Conversation {
  id: string;
  updatedAt: string;
  unreadCount: number;
  lastMessage: { content: string; createdAt: string } | null;
  user: { id: string; name: string | null; avatarUrl: string | null; isOnline: boolean } | null;
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

  const { data: conversations, isPending } = useQuery<Conversation[]>({
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

      <div className="flex h-[calc(100vh-16rem)] gap-4">
        <aside className="flex w-72 shrink-0 flex-col rounded-xl border border-outline-variant bg-surface-container-lowest">
          {isPending ? (
            <div className="p-3">
              <ListSkeleton rows={4} />
            </div>
          ) : (conversations?.length ?? 0) === 0 ? (
            <p className="p-4 text-body-sm text-on-surface-variant">
              No conversations yet. Buyers can message you from your product pages.
            </p>
          ) : (
            <div className="flex flex-col overflow-y-auto">
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
                    <div className="relative shrink-0">
                      {conversation.user?.avatarUrl ? (
                        <Image
                          src={conversation.user.avatarUrl}
                          alt=""
                          width={36}
                          height={36}
                          className="size-9 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex size-9 items-center justify-center rounded-full bg-surface-container">
                          <User className="size-4 text-on-surface-variant" />
                        </span>
                      )}
                      {conversation.user?.isOnline && (
                        <span className="absolute right-0 bottom-0 size-2.5 rounded-full bg-green-500 ring-2 ring-surface-container-lowest" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-body-md text-on-surface">
                        {conversation.user?.name ?? 'Customer'}
                      </p>
                      <p className="truncate text-body-sm text-on-surface-variant">
                        {conversation.lastMessage?.content ?? 'No messages yet'}
                      </p>
                    </div>
                    {unread > 0 && (
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-on-primary tabular-nums">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        <section className="flex min-w-0 flex-1 flex-col rounded-xl border border-outline-variant bg-surface-container-lowest">
          {!active ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
              <MessagesSquare className="size-8 text-on-surface-variant" />
              <p className="text-body-lg text-on-surface">Select a conversation</p>
            </div>
          ) : (
            <>
              <div className="border-b border-outline-variant px-4 py-3">
                <p className="text-title-sm text-on-surface">
                  {active.user?.name ?? 'Customer'}
                </p>
                <p className="text-body-sm text-on-surface-variant">
                  {active.user?.isOnline ? 'Online' : 'Offline'}
                </p>
              </div>

              <MessagePane
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

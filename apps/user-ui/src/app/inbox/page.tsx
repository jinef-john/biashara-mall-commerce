'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { MessagesSquare, Store } from 'lucide-react';
import { useApi } from '../../lib/api';
import { useMe } from '../../lib/use-me';
import { useWebSocket } from '../../context/web-socket-context';
import { useConversation } from '../../shared/hooks/use-conversation';
import { ChatInput } from '../../shared/components/chat/chat-input';
import { MessagePane } from '../../shared/components/chat/message-pane';
import { NotificationListSkeleton } from '../../shared/components/skeletons';

interface Conversation {
  id: string;
  updatedAt: string;
  unreadCount: number;
  lastMessage: { content: string; createdAt: string } | null;
  shop: { id: string; name: string; logoUrl: string | null; isOnline: boolean } | null;
}

function Inbox() {
  const api = useApi();
  const params = useSearchParams();
  const { data: me } = useMe();
  const { unreadCounts, sendMessage, markAsSeen, ready } = useWebSocket();
  const [activeId, setActiveId] = useState<string | null>(params.get('c'));

  const { data: conversations, isPending } = useQuery<Conversation[]>({
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

  return (
    <main className="mx-auto flex h-[calc(100vh-var(--header-height,4rem))] max-w-6xl gap-4 px-4 py-6">
      <aside className="flex w-72 shrink-0 flex-col rounded-xl border border-outline-variant bg-surface-container-lowest">
        <h1 className="border-b border-outline-variant px-4 py-3 text-title-md text-on-surface">
          Messages
        </h1>
        {isPending ? (
          <div className="p-3">
            <NotificationListSkeleton rows={4} />
          </div>
        ) : (conversations?.length ?? 0) === 0 ? (
          <p className="p-4 text-body-sm text-on-surface-variant">
            No conversations yet. Message a shop from any product page.
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
                    {conversation.shop?.logoUrl ? (
                      <Image
                        src={conversation.shop.logoUrl}
                        alt=""
                        width={36}
                        height={36}
                        className="size-9 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex size-9 items-center justify-center rounded-full bg-surface-container">
                        <Store className="size-4 text-on-surface-variant" />
                      </span>
                    )}
                    {conversation.shop?.isOnline && (
                      <span className="absolute right-0 bottom-0 size-2.5 rounded-full bg-green-500 ring-2 ring-surface-container-lowest" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-body-md text-on-surface">
                      {conversation.shop?.name ?? 'Shop'}
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
            <div className="flex items-center justify-between border-b border-outline-variant px-4 py-3">
              <div>
                <p className="text-title-sm text-on-surface">{active.shop?.name}</p>
                <p className="text-body-sm text-on-surface-variant">
                  {active.shop?.isOnline ? 'Online' : 'Offline'}
                </p>
              </div>
              {active.shop && (
                <Link
                  href={`/shop/${active.shop.id}`}
                  className="text-body-sm text-primary hover:underline"
                >
                  Visit shop
                </Link>
              )}
            </div>

            <MessagePane
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

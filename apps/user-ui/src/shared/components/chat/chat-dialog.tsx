'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { Store, X } from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@biashara-mall/ui/components/ui/avatar';
import { Button } from '@biashara-mall/ui/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@biashara-mall/ui/components/ui/dialog';
import { Skeleton } from '@biashara-mall/ui/components/ui/skeleton';
import { useWebSocket } from '../../../context/web-socket-context';
import { useMe } from '../../../lib/use-me';
import { useConversation } from '../../hooks/use-conversation';
import { ChatInput } from './chat-input';
import { MessagePane } from './message-pane';
import { ProductContextCard, type ProductContext } from './product-context-card';

export function ChatDialog({
  open,
  onOpenChange,
  conversationId,
  shopId,
  shopName,
  shopLogoUrl,
  product,
  starting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string | null;
  shopId: string;
  shopName: string;
  shopLogoUrl?: string | null;
  product?: ProductContext;
  starting: boolean;
}) {
  const { data: me } = useMe();
  const { ready, sendMessage, markAsSeen } = useWebSocket();
  const { messages, hasMore, loading, loadPrevious } = useConversation(
    open ? conversationId : null,
    '/chatting/api/get-messages',
  );

  useEffect(() => {
    if (open && conversationId && ready) markAsSeen(conversationId);
  }, [open, conversationId, ready, markAsSeen, messages.length]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[32rem] max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
      >
        <DialogHeader className="flex shrink-0 flex-row items-center gap-3 bg-primary px-4 py-3 text-left text-on-primary">
          <Avatar className="size-9 shrink-0">
            {shopLogoUrl && <AvatarImage src={shopLogoUrl} alt="" />}
            <AvatarFallback>
              {shopName ? (
                shopName.slice(0, 1).toUpperCase()
              ) : (
                <Store className="size-4" />
              )}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <DialogTitle className="truncate text-base">{shopName}</DialogTitle>
            <DialogDescription className="text-xs text-on-primary/80">
              {ready ? 'Online' : 'Connecting…'} ·{' '}
              <Link href={`/shop/${shopId}`} className="underline underline-offset-4">
                Visit shop
              </Link>
            </DialogDescription>
          </div>
          <DialogClose asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="shrink-0 text-on-primary hover:bg-on-primary/15 hover:text-on-primary"
            >
              <X />
              <span className="sr-only">Close</span>
            </Button>
          </DialogClose>
        </DialogHeader>

        {product && <ProductContextCard product={product} label="Asking about" />}

        {starting || !conversationId ? (
          <div className="flex flex-1 flex-col gap-3 p-4">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-10 w-1/2 self-end" />
            <Skeleton className="h-10 w-3/5" />
          </div>
        ) : (
          <MessagePane
            messages={messages}
            hasMore={hasMore}
            loading={loading}
            onLoadPrevious={loadPrevious}
            isOwn={(message) => message.senderId === me?.id}
            counterpart={{ name: shopName, avatarUrl: shopLogoUrl }}
          />
        )}

        <ChatInput
          disabled={!ready || !conversationId}
          onSend={(body) =>
            conversationId &&
            sendMessage({ conversationId, toUserId: shopId, messageBody: body })
          }
        />
      </DialogContent>
    </Dialog>
  );
}

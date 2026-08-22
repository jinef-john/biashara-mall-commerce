'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useMutation } from '@tanstack/react-query';
import { MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@biashara-mall/ui/components/ui/button';
import { useApi } from '../../../lib/api';
import { ChatDialog } from './chat-dialog';
import type { ProductContext } from './product-context-card';
import { useIsSuspended } from '../../../lib/use-me';

export function ChatWithSellerButton({
  shopId,
  shopName,
  shopLogoUrl,
  product,
  size = 'default',
}: {
  shopId: string;
  shopName: string;
  shopLogoUrl?: string | null;
  product?: ProductContext;
  size?: 'default' | 'sm';
}) {
  const api = useApi();
  const { isSignedIn } = useAuth();
  const suspended = useIsSuspended();
  const [open, setOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const start = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/chatting/api/create-user-conversationGroup', {
        shopId,
        productId: product?.id,
      });
      return data.conversation.id as string;
    },
    onSuccess: (id) => setConversationId(id),
    onError: () => {
      setOpen(false);
      toast.error('Could not open the conversation. Is the chat service running?');
    },
  });

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size={size}
        disabled={start.isPending || suspended}
        title={suspended ? 'Your account is suspended' : undefined}
        onClick={() => {
          if (!isSignedIn) {
            toast.error('Sign in to message this shop');
            return;
          }
          setOpen(true);
          start.mutate();
        }}
      >
        <MessageCircle />
        Chat with seller
      </Button>

      <ChatDialog
        open={open}
        onOpenChange={setOpen}
        conversationId={conversationId}
        shopId={shopId}
        shopName={shopName}
        shopLogoUrl={shopLogoUrl}
        product={product}
        starting={start.isPending}
      />
    </>
  );
}

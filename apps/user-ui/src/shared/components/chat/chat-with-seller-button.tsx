'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useMutation } from '@tanstack/react-query';
import { MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@biashara-mall/ui/components/ui/button';
import { useApi } from '../../../lib/api';

export function ChatWithSellerButton({
  shopId,
  size = 'default',
}: {
  shopId: string;
  size?: 'default' | 'sm';
}) {
  const api = useApi();
  const router = useRouter();
  const { isSignedIn } = useAuth();

  const start = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/chatting/api/create-user-conversationGroup', {
        shopId,
      });
      return data.conversation.id as string;
    },
    onSuccess: (conversationId) => router.push(`/inbox?c=${conversationId}`),
    onError: () => toast.error('Could not open the conversation'),
  });

  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      disabled={start.isPending}
      onClick={() => {
        if (!isSignedIn) {
          toast.error('Sign in to message this shop');
          return;
        }
        start.mutate();
      }}
    >
      <MessageCircle />
      Chat with seller
    </Button>
  );
}

'use client';

import { useAuth } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { useApi } from './api';

export interface Me {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  role: 'user' | 'admin';
}

// The Mongo User.id, not the Clerk id: chat handshakes and every participant
// relation key off the ObjectId.
export function useMe() {
  const api = useApi();
  const { isSignedIn } = useAuth();

  return useQuery<Me>({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await api.get('/user/api/me');
      return data.user;
    },
    enabled: Boolean(isSignedIn),
    staleTime: Infinity,
  });
}

'use client';

import { useAuth } from '@clerk/nextjs';
import axios from 'axios';
import { useMemo } from 'react';

const baseURL = process.env.NEXT_PUBLIC_API_GATEWAY_URL;

/** For the storefront's public reads — no session, usable outside React too. */
export const publicApi = axios.create({ baseURL });

/** Axios instance that attaches the current Clerk session token to every request. */
export function useApi() {
  const { getToken } = useAuth();

  return useMemo(() => {
    const instance = axios.create({ baseURL });
    instance.interceptors.request.use(async (config) => {
      const token = await getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
    return instance;
  }, [getToken]);
}

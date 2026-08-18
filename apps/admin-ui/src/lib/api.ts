'use client';

import { useAuth } from '@clerk/nextjs';
import axios from 'axios';
import { useMemo } from 'react';

/** Axios instance that attaches the current Clerk session token to every request. */
export function useApi() {
  const { getToken } = useAuth();

  return useMemo(() => {
    const instance = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_GATEWAY_URL,
    });
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

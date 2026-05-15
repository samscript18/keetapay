'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useCallback } from 'react';

export function useAuthenticatedApi() {
  const { getAccessToken } = usePrivy();

  const token = useCallback(async () => {
    const value = await getAccessToken();
    if (!value) throw new Error('Please sign in again');
    return value;
  }, [getAccessToken]);

  return { token };
}

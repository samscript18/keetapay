'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { useAuthenticatedApi } from '@/hooks/use-authenticated-api';
import { useTranslations } from 'next-intl';

export default function OnboardingPage() {
  const t = useTranslations('onboarding');
  const router = useRouter();
  const { ready, authenticated } = usePrivy();
  const { token } = useAuthenticatedApi();
  const [username, setUsername] = useState('alex');
  const [available, setAvailable] = useState<boolean | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ready && !authenticated) router.replace('/');
  }, [ready, authenticated, router]);

  useEffect(() => {
    const id = setTimeout(async () => {
      if (/^[a-z0-9_]{3,20}$/.test(username)) {
        setCheckingAvailability(true);
        try {
          const result = await api.availability(username);
          setAvailable(result.available);
        } finally {
          setCheckingAvailability(false);
        }
      } else {
        setAvailable(null);
      }
    }, 300);
    return () => clearTimeout(id);
  }, [username]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const authToken = await token();
      await api.createProfile(authToken, username);
      toast.success(t('claimed', { username }));
      router.push('/dashboard');
    } catch (error) {
      toast.error(t('failed'), { description: error instanceof Error ? error.message : t('tryAnother') });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <Card className="w-full max-w-md">
        <h1 className="text-3xl font-black">{t('title')}</h1>
        <p className="mt-2 text-sm text-white/50">{t('description')}</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <Input value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace('@', ''))} placeholder="alex" />
          {checkingAvailability ? (
            <Skeleton className="h-4 w-48" />
          ) : (
            <p className={available ? 'text-sm text-accent' : 'text-sm text-coral'}>
              {available === null ? t('hint') : available ? t('available', { username }) : t('taken', { username })}
            </p>
          )}
          <Button className="w-full" loading={loading} disabled={!available}>{loading ? t('creating') : t('create')}</Button>
        </form>
      </Card>
    </main>
  );
}

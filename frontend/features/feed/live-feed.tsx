'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { api, ApiTransaction } from '@/lib/api';
import { Avatar } from '@/components/ui/avatar';

const fallback = [
  { from: 'alex', to: 'emma', amount: '5', message: 'coffee' },
  { from: 'sam', to: 'lisa', amount: '12', message: 'tickets' },
  { from: 'maya', to: 'rio', amount: '3', message: 'lunch' },
  { from: 'nora', to: 'kai', amount: '9', message: 'studio split' },
];

export function LiveFeed({ compact = false }: { compact?: boolean }) {
  const [items, setItems] = useState<ApiTransaction[]>([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const feed = await api.feed();
        if (mounted) setItems(feed);
      } catch {
        if (mounted) setItems([]);
      }
    };
    load();
    const id = setInterval(load, 7000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  const display = useMemo(() => {
    if (items.length) {
      return items.map((tx) => ({
        key: tx._id,
        from: tx.fromUserId?.username ?? 'user',
        to: tx.toUserId?.username ?? 'friend',
        amount: tx.amount,
        message: tx.message || 'sent KTA',
        avatar: tx.fromUserId?.profileImage,
      }));
    }
    return fallback.map((item, index) => ({ ...item, key: `demo-${index}` }));
  }, [items]);

  const lane = [...display, ...display];

  return (
    <div className={compact ? 'overflow-hidden border-y border-white/10 bg-white/[0.03] py-2' : 'overflow-hidden py-4'}>
      <motion.div className="flex w-max gap-3" animate={{ x: ['0%', '-50%'] }} transition={{ repeat: Infinity, duration: 28, ease: 'linear' }}>
        {lane.map((item, index) => (
          <div key={`${item.key}-${index}`} className="glass flex min-w-[330px] items-center gap-3 rounded-[8px] px-4 py-2">
            <Avatar src={(item as any).avatar} username={item.from} size="sm" />
            <p className="flex min-w-0 items-center gap-2 truncate text-sm text-white/82">
              <UsernamePill username={item.from} /> <span>sent</span> <span className="font-semibold text-accent">{item.amount} KTA</span> <span>to</span>{' '}
              <UsernamePill username={item.to} variant="sky" />
              {item.message ? <span className="text-white/45"> · {item.message}</span> : null}
            </p>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

function UsernamePill({ username, variant = 'accent' }: { username: string; variant?: 'accent' | 'sky' }) {
  return (
    <span className={variant === 'accent' ? 'rounded-full bg-accent/15 px-2 py-1 font-bold text-accent' : 'rounded-full bg-sky/15 px-2 py-1 font-bold text-sky'}>
      @{username}
    </span>
  );
}

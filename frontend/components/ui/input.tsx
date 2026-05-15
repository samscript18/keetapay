import * as React from 'react';
import { cn } from '@/lib/utils';

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'h-12 w-full rounded-[8px] border border-white/10 bg-white/[0.06] px-4 text-sm text-white outline-none placeholder:text-white/38 focus:border-accent',
        props.className,
      )}
    />
  );
}

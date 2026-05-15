import * as React from 'react';
import { cn } from '@/lib/utils';

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        'min-h-24 w-full resize-none rounded-[8px] border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none placeholder:text-white/38 focus:border-accent',
        props.className,
      )}
    />
  );
}

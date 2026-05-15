import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
};

export function Button({ children, className, disabled, loading = false, variant = 'primary', asChild, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button';
  const disabledProps = asChild ? {} : { disabled: disabled || loading };
  const content = loading && !asChild ? (
    <>
      <LoaderCircle size={17} className="animate-spin" />
      {children}
    </>
  ) : (
    children
  );

  return (
    <Comp
      className={cn(
        'inline-flex h-11 items-center justify-center gap-2 rounded-[8px] px-5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-accent disabled:pointer-events-none disabled:opacity-50',
        variant === 'primary' && 'bg-accent text-black shadow-glow hover:bg-[#6affbc]',
        variant === 'secondary' && 'glass text-white hover:bg-white/12',
        variant === 'ghost' && 'text-white hover:bg-white/10',
        className,
      )}
      {...disabledProps}
      {...props}
    >
      {content}
    </Comp>
  );
}

import { initials } from '@/lib/utils';

export function Avatar({ src, username, size = 'md' }: { src?: string; username?: string; size?: 'sm' | 'md' | 'lg' }) {
  const dimensions = size === 'lg' ? 'h-16 w-16 text-lg' : size === 'sm' ? 'h-8 w-8 text-xs' : 'h-11 w-11 text-sm';
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className={`${dimensions} rounded-full object-cover`} />
  ) : (
    <div className={`${dimensions} grid place-items-center rounded-full bg-accent font-bold text-black`}>{initials(username)}</div>
  );
}

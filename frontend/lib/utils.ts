import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function initials(username?: string) {
  return (username ?? 'KP').replace('@', '').slice(0, 2).toUpperCase();
}

export function shortAddress(address?: string) {
  if (!address) return '...';
  return `${address.slice(0, 10)}...${address.slice(-6)}`;
}

export function shortBlockHash(blockHash?: string) {
  if (!blockHash) return '...';
  return `${blockHash.slice(0, 10)}...${blockHash.slice(-6)}`;
}

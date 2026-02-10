'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const tabItems = [
  {
    href: '/salon/buchen',
    label: 'Buchen',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
  },
  {
    href: '/salon/kalender',
    label: 'Kalender',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  },
];

export const SalonNav = () => {
  const pathname = usePathname();
  const router = useRouter();

  const handleLock = () => {
    sessionStorage.clear();
    router.push('/salon');
  };

  return (
    <nav className="flex border-t border-border bg-white">
      {tabItems.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-1 py-3 text-xs font-medium transition-colors',
              active ? 'text-primary' : 'text-foreground/40 hover:text-foreground/60'
            )}
            style={{ minHeight: 56 }}
          >
            {item.icon}
            {item.label}
          </Link>
        );
      })}
      <button
        onClick={handleLock}
        className="flex flex-1 flex-col items-center justify-center gap-1 py-3 text-xs font-medium text-foreground/40 transition-colors hover:text-foreground/60"
        style={{ minHeight: 56 }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        Sperren
      </button>
    </nav>
  );
};

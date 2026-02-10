'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { logout } from '@/lib/api';

const navItems = [
  { href: '/portal/termine', label: 'Meine Termine' },
  { href: '/portal/info', label: 'Infos' },
];

export const PortalNav = () => {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <header className="border-b border-border bg-white">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <span className="font-serif text-lg font-semibold text-foreground">
          Hautschimmer
        </span>
        <div className="flex items-center gap-4">
          <nav className="flex gap-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'text-sm transition-colors',
                  pathname.startsWith(item.href)
                    ? 'font-medium text-primary'
                    : 'text-foreground/50 hover:text-primary'
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <button
            onClick={handleLogout}
            className="text-sm text-foreground/40 transition-colors hover:text-foreground"
          >
            Abmelden
          </button>
        </div>
      </div>
    </header>
  );
};

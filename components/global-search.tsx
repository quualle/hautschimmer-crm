'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { searchCustomers } from '@/lib/api';
import type { CustomerSearchResult } from '@/lib/types';
import { Avatar } from '@/components/ui/avatar';

const locationLabel = (loc: string | null): string => {
  if (!loc) return '';
  return loc === 'kw' ? 'KW' : 'Neumarkt';
};

export const GlobalSearch = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CustomerSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const router = useRouter();

  const handleClose = useCallback(() => {
    setOpen(false);
    setQuery('');
    setResults([]);
  }, []);

  // Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && open) {
        handleClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, handleClose]);

  // Auto-focus on open
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        const data = await searchCustomers(query.trim());
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query]);

  const navigateTo = (id: string) => {
    handleClose();
    router.push(`/dashboard/kunden/${id}`);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div className="fixed inset-0 bg-foreground/40 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-white shadow-2xl">
        {/* Search Input */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <svg
            className="shrink-0 text-foreground/40"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Kundin suchen..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-foreground/40"
          />
          <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-foreground/40 sm:inline-block">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {loading && (
            <div className="px-4 py-6 text-center text-sm text-foreground/50">
              Suche...
            </div>
          )}
          {!loading && query && results.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-foreground/50">
              Keine Ergebnisse
            </div>
          )}
          {!loading &&
            results.map((c) => (
              <button
                key={c.id}
                onClick={() => navigateTo(c.id)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted"
              >
                <Avatar name={`${c.first_name} ${c.last_name}`} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {c.first_name} {c.last_name}
                  </p>
                  <p className="truncate text-xs text-foreground/50">
                    {[c.phone, c.email, locationLabel(c.location)]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
              </button>
            ))}
          {!loading && !query && (
            <div className="px-4 py-6 text-center text-sm text-foreground/50">
              Name, Telefon oder E-Mail eingeben...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

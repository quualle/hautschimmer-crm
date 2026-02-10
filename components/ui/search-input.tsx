'use client';

import { cn } from '@/lib/utils';
import { forwardRef, useEffect, useRef, useState, type InputHTMLAttributes } from 'react';

interface SearchInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  onChange?: (value: string) => void;
  debounceMs?: number;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, onChange, debounceMs = 300, ...props }, ref) => {
    const [value, setValue] = useState('');
    const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    useEffect(() => {
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }, []);

    const handleChange = (val: string) => {
      setValue(val);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onChange?.(val);
      }, debounceMs);
    };

    return (
      <div className={cn('relative', className)}>
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40"
          width="16"
          height="16"
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
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          className="w-full rounded-lg border border-border bg-muted py-2.5 pl-10 pr-9 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
          {...props}
        />
        {value && (
          <button
            type="button"
            onClick={() => handleChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        )}
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';

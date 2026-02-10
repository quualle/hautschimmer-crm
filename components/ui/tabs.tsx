'use client';

import { cn } from '@/lib/utils';
import { type ReactNode, useState } from 'react';

interface Tab {
  id: string;
  label: string;
  content: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  className?: string;
}

export const Tabs = ({ tabs, defaultTab, className }: TabsProps) => {
  const [active, setActive] = useState(defaultTab || tabs[0]?.id);

  return (
    <div className={className}>
      <div className="flex border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={cn(
              'relative px-4 py-2.5 text-sm font-medium transition-colors',
              active === tab.id
                ? 'text-primary'
                : 'text-foreground/50 hover:text-foreground/80'
            )}
          >
            {tab.label}
            {active === tab.id && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </div>
      <div className="pt-4">
        {tabs.find((t) => t.id === active)?.content}
      </div>
    </div>
  );
};

'use client';

import { useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { getTreatmentHistory } from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface TreatmentTimelineProps {
  customerId: string;
  refreshKey?: number;
}

interface TimelineEntry {
  id: string;
  date: string;
  type: string;
  note_type?: string;
  notes?: string;
  treatment_name?: string;
  status?: string;
  source?: string;
}

const noteTypeLabels: Record<string, string> = {
  treatment: 'Behandlung',
  consultation: 'Beratung',
  follow_up: 'Nachsorge',
  general: 'Allgemein',
  consent_form: 'Einwilligung',
};

const noteTypeVariants: Record<string, 'default' | 'success' | 'info' | 'warning'> = {
  treatment: 'success',
  consultation: 'info',
  follow_up: 'warning',
  general: 'default',
  consent_form: 'default',
};

export const TreatmentTimeline = ({ customerId, refreshKey }: TreatmentTimelineProps) => {
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getTreatmentHistory(customerId);
      if (result.ok && result.data?.timeline) {
        setEntries(result.data.timeline as TimelineEntry[]);
      }
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 8v4l3 3" />
            <circle cx="12" cy="12" r="10" />
          </svg>
        }
        title="Keine Behandlungen"
        description="Noch keine Behandlungen dokumentiert."
      />
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />
      <div className="space-y-6">
        {entries.map((entry) => (
          <div key={entry.id} className="relative flex gap-4 pl-2">
            <div className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white border border-border">
              <div className="h-2.5 w-2.5 rounded-full bg-primary" />
            </div>
            <div className="flex-1 pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-foreground">
                  {entry.treatment_name || noteTypeLabels[entry.note_type || ''] || 'Eintrag'}
                </span>
                {entry.note_type && (
                  <Badge variant={noteTypeVariants[entry.note_type] || 'default'}>
                    {noteTypeLabels[entry.note_type] || entry.note_type}
                  </Badge>
                )}
              </div>
              <p className="mt-0.5 text-xs text-foreground/50">
                {entry.date ? formatDate(entry.date) : ''}
                {entry.source && entry.source !== 'manual' && ` · via ${entry.source}`}
              </p>
              {entry.notes && (
                <p className="mt-1.5 text-sm text-foreground/70 leading-relaxed">
                  {entry.notes}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

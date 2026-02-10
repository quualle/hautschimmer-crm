'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonTableRow } from '@/components/ui/skeleton';
import { searchCustomers, getCustomerOverview } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { CustomerSearchResult } from '@/lib/types';

interface CustomerListProps {
  query: string;
  onEdit: (customer: CustomerSearchResult) => void;
  onLogTreatment: (customer: CustomerSearchResult) => void;
  refreshKey: number;
}

const locationLabel: Record<string, string> = {
  neumarkt: 'Neumarkt',
  kw: 'KW',
};

export const CustomerList = ({
  query,
  onEdit,
  onLogTreatment,
  refreshKey,
}: CustomerListProps) => {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerSearchResult[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (query.trim()) {
        const results = await searchCustomers(query);
        setCustomers(results);
      } else {
        const overview = await getCustomerOverview();
        const mapped: CustomerSearchResult[] = (overview || []).map(
          (c: Record<string, unknown>) => ({
            ...c,
            total_appointments: Number(c.total_appointments || 0),
            last_appointment_date: (c.last_appointment_date as string) || null,
            next_appointment_date: (c.next_appointment_date as string) || null,
            total_revenue: Number(c.total_revenue || 0),
            similarity: 1,
          })
        ) as CustomerSearchResult[];
        mapped.sort((a, b) =>
          `${a.last_name} ${a.first_name}`.localeCompare(
            `${b.last_name} ${b.first_name}`,
            'de'
          )
        );
        setCustomers(mapped);
      }
    } catch {
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonTableRow key={i} />
        ))}
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <EmptyState
        icon={
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        }
        title={query ? 'Keine Ergebnisse' : 'Noch keine Kundinnen'}
        description={
          query
            ? `Keine Kundinnen für "${query}" gefunden.`
            : 'Legen Sie Ihre erste Kundin an.'
        }
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs font-medium uppercase tracking-wider text-foreground/50">
            <th className="pb-3 pr-4">Name</th>
            <th className="hidden pb-3 pr-4 md:table-cell">Telefon</th>
            <th className="hidden pb-3 pr-4 lg:table-cell">E-Mail</th>
            <th className="hidden pb-3 pr-4 sm:table-cell">Standort</th>
            <th className="hidden pb-3 pr-4 xl:table-cell">Tags</th>
            <th className="hidden pb-3 pr-4 md:table-cell">Letzter Besuch</th>
            <th className="pb-3 text-right">Aktionen</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {customers.map((c) => (
            <tr
              key={c.id}
              onClick={() => router.push(`/dashboard/kunden/${c.id}`)}
              className="cursor-pointer transition-colors hover:bg-muted/50"
            >
              <td className="py-3 pr-4">
                <div className="flex items-center gap-3">
                  <Avatar name={`${c.first_name} ${c.last_name}`} size="sm" />
                  <span className="font-medium text-foreground">
                    {c.first_name} {c.last_name}
                  </span>
                </div>
              </td>
              <td className="hidden py-3 pr-4 text-foreground/60 md:table-cell">
                {c.phone || '—'}
              </td>
              <td className="hidden py-3 pr-4 text-foreground/60 lg:table-cell">
                {c.email || '—'}
              </td>
              <td className="hidden py-3 pr-4 sm:table-cell">
                {c.location ? (
                  <Badge>{locationLabel[c.location] || c.location}</Badge>
                ) : (
                  <span className="text-foreground/40">—</span>
                )}
              </td>
              <td className="hidden py-3 pr-4 xl:table-cell">
                <div className="flex flex-wrap gap-1">
                  {c.tags?.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="info">
                      {tag}
                    </Badge>
                  ))}
                  {c.tags?.length > 3 && (
                    <Badge>+{c.tags.length - 3}</Badge>
                  )}
                  {(!c.tags || c.tags.length === 0) && (
                    <span className="text-foreground/40">—</span>
                  )}
                </div>
              </td>
              <td className="hidden py-3 pr-4 text-foreground/60 md:table-cell">
                {c.last_appointment_date
                  ? formatDate(c.last_appointment_date)
                  : '—'}
              </td>
              <td className="py-3 text-right">
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="inline-block"
                >
                  <DropdownMenu
                    trigger={
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground/40 transition-colors hover:bg-muted hover:text-foreground">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="12" cy="5" r="1.5" />
                          <circle cx="12" cy="12" r="1.5" />
                          <circle cx="12" cy="19" r="1.5" />
                        </svg>
                      </span>
                    }
                    items={[
                      {
                        label: 'Bearbeiten',
                        onClick: () => onEdit(c),
                        icon: (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                          </svg>
                        ),
                      },
                      {
                        label: 'Behandlung loggen',
                        onClick: () => onLogTreatment(c),
                        icon: (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 8v4l3 3" />
                            <circle cx="12" cy="12" r="10" />
                          </svg>
                        ),
                      },
                      {
                        label: 'E-Mail senden',
                        onClick: () => {
                          if (c.email) {
                            window.open(`mailto:${c.email}`, '_blank');
                          }
                        },
                        icon: (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="20" height="16" x="2" y="4" rx="2" />
                            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                          </svg>
                        ),
                      },
                    ]}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

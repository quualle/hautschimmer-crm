'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Modal } from '@/components/ui/modal';
import { SkeletonTableRow } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/stat-card';
import { getCampaigns } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { CampaignForm } from './components/campaign-form';
import type { Campaign } from '@/lib/types';

// ========== Helpers ==========

const statusLabel: Record<string, string> = {
  draft: 'Entwurf',
  scheduled: 'Geplant',
  sending: 'Wird gesendet',
  sent: 'Gesendet',
  cancelled: 'Abgebrochen',
};

const statusVariant = (
  status: string
): 'default' | 'info' | 'warning' | 'success' | 'danger' => {
  switch (status) {
    case 'draft':
      return 'default';
    case 'scheduled':
      return 'info';
    case 'sending':
      return 'warning';
    case 'sent':
      return 'success';
    case 'cancelled':
      return 'danger';
    default:
      return 'default';
  }
};

const formatPercent = (part: number, total: number): string => {
  if (total === 0) return '0%';
  return Math.round((part / total) * 100) + '%';
};

// ========== Icons ==========

const MailIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const SendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 2L11 13" />
    <path d="M22 2L15 22L11 13L2 9L22 2Z" />
  </svg>
);

const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const ClickIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 9l5 12 1.8-5.2L21 14z" />
    <path d="M7.2 2.2L8 5.1M1.1 8.1l2.9.8M13.4 2.1l-.8 2.9" />
  </svg>
);

// ========== Campaign Detail Modal ==========

const CampaignDetail = ({
  campaign,
  onClose,
}: {
  campaign: Campaign;
  onClose: () => void;
}) => (
  <Modal open onClose={onClose} title={campaign.name} size="lg">
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="text-center">
          <p className="text-2xl font-semibold text-foreground">{campaign.total_recipients}</p>
          <p className="text-xs text-foreground/50">Empfaenger</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-semibold text-foreground">{campaign.total_sent}</p>
          <p className="text-xs text-foreground/50">Gesendet</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-semibold text-success">{campaign.total_opened}</p>
          <p className="text-xs text-foreground/50">
            Geoeffnet ({formatPercent(campaign.total_opened, campaign.total_sent)})
          </p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-semibold text-primary">{campaign.total_clicked}</p>
          <p className="text-xs text-foreground/50">
            Geklickt ({formatPercent(campaign.total_clicked, campaign.total_sent)})
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-foreground/50">Status</p>
          <Badge variant={statusVariant(campaign.status)}>
            {statusLabel[campaign.status] || campaign.status}
          </Badge>
        </div>
        <div>
          <p className="text-foreground/50">Betreff</p>
          <p className="font-medium">{campaign.subject}</p>
        </div>
        {campaign.template?.name && (
          <div>
            <p className="text-foreground/50">Template</p>
            <p className="font-medium">{campaign.template.name}</p>
          </div>
        )}
        <div>
          <p className="text-foreground/50">Erstellt am</p>
          <p className="font-medium">{formatDate(campaign.created_at)}</p>
        </div>
        {campaign.sent_at && (
          <div>
            <p className="text-foreground/50">Gesendet am</p>
            <p className="font-medium">{formatDate(campaign.sent_at)}</p>
          </div>
        )}
      </div>

      {campaign.body_html && (
        <div className="rounded-lg border border-border p-4">
          <p className="mb-2 text-xs font-medium text-foreground/50">Vorschau</p>
          <div
            className="prose prose-sm max-h-60 overflow-y-auto"
            dangerouslySetInnerHTML={{ __html: campaign.body_html }}
          />
        </div>
      )}
    </div>
  </Modal>
);

// ========== Main Page ==========

export default function KampagnenPage() {
  const searchParams = useSearchParams();
  const [campaigns, setCampaigns] = useState<Campaign[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(searchParams.get('action') === 'new');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  const loadCampaigns = async () => {
    try {
      const data = await getCampaigns();
      setCampaigns(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden');
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  const totalSent = campaigns?.filter((c) => c.status === 'sent').length ?? 0;
  const totalOpened = campaigns?.reduce((sum, c) => sum + c.total_opened, 0) ?? 0;
  const totalClicked = campaigns?.reduce((sum, c) => sum + c.total_clicked, 0) ?? 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-foreground">
            Kampagnen
          </h1>
          <p className="mt-1 text-sm text-foreground/50">
            E-Mail-Kampagnen erstellen und verwalten
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            Neue Kampagne
          </Button>
        )}
      </div>

      {/* Campaign Form */}
      {showForm && (
        <CampaignForm
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            loadCampaigns();
          }}
        />
      )}

      {/* Stats */}
      {!showForm && campaigns && campaigns.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            title="Gesendet"
            value={totalSent}
            subtitle="Kampagnen"
            icon={<SendIcon />}
          />
          <StatCard
            title="Geoeffnet"
            value={totalOpened}
            subtitle="insgesamt"
            icon={<EyeIcon />}
          />
          <StatCard
            title="Geklickt"
            value={totalClicked}
            subtitle="insgesamt"
            icon={<ClickIcon />}
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <Card className="border-danger/30 bg-danger/5 text-danger text-sm">
          {error}
        </Card>
      )}

      {/* Campaign List */}
      {!showForm && (
        <Card>
          {campaigns === null ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonTableRow key={i} />
              ))}
            </div>
          ) : campaigns.length === 0 ? (
            <EmptyState
              icon={<MailIcon />}
              title="Noch keine Kampagnen"
              description="Erstelle deine erste E-Mail-Kampagne."
              action={
                <Button size="sm" onClick={() => setShowForm(true)}>
                  Neue Kampagne
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-foreground/50">
                    <th className="pb-3 pr-4 font-medium">Name</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="hidden pb-3 pr-4 font-medium sm:table-cell">Empfaenger</th>
                    <th className="hidden pb-3 pr-4 font-medium md:table-cell">Geoeffnet</th>
                    <th className="hidden pb-3 pr-4 font-medium md:table-cell">Geklickt</th>
                    <th className="pb-3 pr-4 font-medium">Erstellt</th>
                    <th className="pb-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((campaign) => (
                    <tr
                      key={campaign.id}
                      className="border-b border-border/50 last:border-0"
                    >
                      <td className="py-3 pr-4">
                        <button
                          onClick={() => setSelectedCampaign(campaign)}
                          className="font-medium text-foreground hover:text-primary"
                        >
                          {campaign.name}
                        </button>
                        <p className="mt-0.5 text-xs text-foreground/40">{campaign.subject}</p>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={statusVariant(campaign.status)}>
                          {statusLabel[campaign.status] || campaign.status}
                        </Badge>
                      </td>
                      <td className="hidden py-3 pr-4 sm:table-cell">
                        {campaign.total_recipients}
                      </td>
                      <td className="hidden py-3 pr-4 md:table-cell">
                        {campaign.total_opened}
                        {campaign.total_sent > 0 && (
                          <span className="ml-1 text-foreground/40">
                            ({formatPercent(campaign.total_opened, campaign.total_sent)})
                          </span>
                        )}
                      </td>
                      <td className="hidden py-3 pr-4 md:table-cell">
                        {campaign.total_clicked}
                        {campaign.total_sent > 0 && (
                          <span className="ml-1 text-foreground/40">
                            ({formatPercent(campaign.total_clicked, campaign.total_sent)})
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-foreground/50">
                        {formatDate(campaign.created_at)}
                      </td>
                      <td className="py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedCampaign(campaign)}
                        >
                          Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Campaign Detail Modal */}
      {selectedCampaign && (
        <CampaignDetail
          campaign={selectedCampaign}
          onClose={() => setSelectedCampaign(null)}
        />
      )}
    </div>
  );
}

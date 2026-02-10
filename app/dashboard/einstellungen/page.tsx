'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Tabs } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonTableRow } from '@/components/ui/skeleton';
import { getTreatments, getEmailTemplates, logout, getSupabaseClient } from '@/lib/api';
import type { Treatment, EmailTemplate } from '@/lib/types';

// ========== Helpers ==========

const formatEur = (amount: number): string =>
  new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

const locationLabel = (locs: string[]): string =>
  locs.map((l) => (l === 'kw' ? 'KW' : 'Neumarkt')).join(', ');

// ========== Icons ==========

const SettingsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const LogOutIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

// ========== Treatment Table ==========

const TreatmentTable = () => {
  const [treatments, setTreatments] = useState<Treatment[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTreatments()
      .then(setTreatments)
      .catch((err) => setError(err instanceof Error ? err.message : 'Fehler'));
  }, []);

  if (error) {
    return (
      <Card className="border-danger/30 bg-danger/5 text-danger text-sm">
        {error}
      </Card>
    );
  }

  if (treatments === null) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonTableRow key={i} />
        ))}
      </div>
    );
  }

  if (treatments.length === 0) {
    return (
      <EmptyState
        title="Keine Behandlungen"
        description="Behandlungen werden in der Datenbank verwaltet."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-foreground/50">
            <th className="pb-3 pr-4 font-medium">Name</th>
            <th className="pb-3 pr-4 font-medium">Kategorie</th>
            <th className="pb-3 pr-4 font-medium">Preis</th>
            <th className="hidden pb-3 pr-4 font-medium sm:table-cell">Dauer</th>
            <th className="hidden pb-3 pr-4 font-medium md:table-cell">Standorte</th>
            <th className="pb-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {treatments.map((t) => (
            <tr key={t.id} className="border-b border-border/50 last:border-0">
              <td className="py-3 pr-4 font-medium">{t.name}</td>
              <td className="py-3 pr-4">
                <Badge>{t.category}</Badge>
              </td>
              <td className="py-3 pr-4">{formatEur(t.price_eur)}</td>
              <td className="hidden py-3 pr-4 sm:table-cell">{t.duration_minutes} Min</td>
              <td className="hidden py-3 pr-4 md:table-cell">
                {locationLabel(t.available_at)}
              </td>
              <td className="py-3">
                <Badge variant={t.active ? 'success' : 'default'}>
                  {t.active ? 'Aktiv' : 'Inaktiv'}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ========== Email Templates ==========

const TemplateList = () => {
  const [templates, setTemplates] = useState<EmailTemplate[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);

  useEffect(() => {
    getEmailTemplates()
      .then(setTemplates)
      .catch((err) => setError(err instanceof Error ? err.message : 'Fehler'));
  }, []);

  if (error) {
    return (
      <Card className="border-danger/30 bg-danger/5 text-danger text-sm">
        {error}
      </Card>
    );
  }

  if (templates === null) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonTableRow key={i} />
        ))}
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <EmptyState
        title="Keine Templates"
        description="E-Mail-Templates werden in der Datenbank verwaltet."
      />
    );
  }

  return (
    <>
      <div className="space-y-2">
        {templates.map((t) => (
          <button
            key={t.id}
            onClick={() => setPreviewTemplate(t)}
            className="w-full rounded-lg border border-border p-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{t.name}</span>
              <div className="flex items-center gap-2">
                <Badge variant={t.template_type === 'marketing' ? 'info' : t.template_type === 'transactional' ? 'warning' : 'default'}>
                  {t.template_type}
                </Badge>
                <Badge variant={t.active ? 'success' : 'default'}>
                  {t.active ? 'Aktiv' : 'Inaktiv'}
                </Badge>
              </div>
            </div>
            <p className="mt-1 text-xs text-foreground/50">{t.subject}</p>
          </button>
        ))}
      </div>

      {previewTemplate && (
        <Modal
          open
          onClose={() => setPreviewTemplate(null)}
          title={previewTemplate.name}
          size="lg"
        >
          <div className="space-y-3">
            <div className="text-sm">
              <span className="text-foreground/50">Betreff: </span>
              <span className="font-medium">{previewTemplate.subject}</span>
            </div>
            {previewTemplate.body_html ? (
              <div className="rounded-lg border border-border bg-white p-4">
                <div
                  className="prose prose-sm max-h-96 overflow-y-auto"
                  dangerouslySetInnerHTML={{
                    __html: previewTemplate.body_html,
                  }}
                />
              </div>
            ) : previewTemplate.body_text ? (
              <pre className="max-h-96 overflow-y-auto rounded-lg border border-border bg-muted p-4 text-xs whitespace-pre-wrap">
                {previewTemplate.body_text}
              </pre>
            ) : (
              <p className="text-sm text-foreground/50">Kein Inhalt vorhanden.</p>
            )}
            {previewTemplate.variables && previewTemplate.variables.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-medium text-foreground/50">Variablen</p>
                <div className="flex flex-wrap gap-1">
                  {previewTemplate.variables.map((v, i) => (
                    <Badge key={i}>{String(v)}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
};

// ========== Salon PIN Section ==========

const SalonSection = () => (
  <div className="space-y-4">
    <div className="rounded-lg border border-border bg-muted/50 p-4">
      <p className="text-sm text-foreground/70">
        Salon-PINs werden direkt in der Supabase-Datenbank verwaltet.
        Jeder Standort hat einen eigenen PIN fuer den Zugang zur Salon-App.
      </p>
    </div>
    <Button
      variant="outline"
      size="sm"
      onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
    >
      Supabase Dashboard oeffnen
    </Button>
  </div>
);

// ========== Account Section ==========

const AccountSection = () => {
  const [email, setEmail] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const load = async () => {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      setEmail(user?.email || null);
    };
    load();
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      window.location.href = '/login';
    } catch {
      setLoggingOut(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-lg border border-border p-4">
        <div>
          <p className="text-sm font-medium text-foreground">Eingeloggt als</p>
          <p className="text-sm text-foreground/50">{email || 'Laden...'}</p>
        </div>
        <Button
          variant="danger"
          size="sm"
          onClick={handleLogout}
          disabled={loggingOut}
        >
          <span className="flex items-center gap-2">
            <LogOutIcon />
            {loggingOut ? 'Wird abgemeldet...' : 'Abmelden'}
          </span>
        </Button>
      </div>
    </div>
  );
};

// ========== Main Page ==========

export default function EinstellungenPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <SettingsIcon />
        </div>
        <div>
          <h1 className="font-serif text-2xl font-semibold text-foreground">
            Einstellungen
          </h1>
          <p className="text-sm text-foreground/50">
            Behandlungen, Templates und Konto verwalten
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          {
            id: 'treatments',
            label: 'Behandlungen',
            content: (
              <Card>
                <TreatmentTable />
              </Card>
            ),
          },
          {
            id: 'templates',
            label: 'E-Mail-Templates',
            content: (
              <Card>
                <TemplateList />
              </Card>
            ),
          },
          {
            id: 'salon',
            label: 'Salon-PIN',
            content: (
              <Card>
                <SalonSection />
              </Card>
            ),
          },
          {
            id: 'account',
            label: 'Account',
            content: (
              <Card>
                <AccountSection />
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}

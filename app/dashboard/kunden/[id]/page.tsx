'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { Tabs } from '@/components/ui/tabs';
import { Skeleton, SkeletonText } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { showToast } from '@/hooks/use-toast';
import {
  getCustomerById,
  getAppointments,
  getTreatmentHistory,
} from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { CustomerForm } from '../components/customer-form';
import { TreatmentLogModal } from '../components/treatment-log-modal';
import { TreatmentTimeline } from '../components/treatment-timeline';
import type { Customer, Appointment, PatientFile } from '@/lib/types';

const locationLabel: Record<string, string> = {
  neumarkt: 'Neumarkt',
  kw: 'Königstein-Wernberg',
};

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'default' }> = {
  confirmed: { label: 'Bestätigt', variant: 'warning' },
  completed: { label: 'Abgeschlossen', variant: 'success' },
  cancelled: { label: 'Storniert', variant: 'danger' },
  no_show: { label: 'Nicht erschienen', variant: 'default' },
};

export default function KundenDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [files, setFiles] = useState<PatientFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showTreatmentLog, setShowTreatmentLog] = useState(false);
  const [treatmentRefreshKey, setTreatmentRefreshKey] = useState(0);

  // Stats derived from appointments
  const totalAppointments = appointments.length;
  const totalRevenue = appointments
    .filter((a) => a.status === 'completed')
    .reduce((sum, a) => sum + (a.price_eur || 0), 0);

  const loadCustomer = useCallback(async () => {
    setLoading(true);
    try {
      const [cust, appts] = await Promise.all([
        getCustomerById(id),
        getAppointments({ customer_id: id }),
      ]);
      setCustomer(cust);
      setAppointments(appts.sort((a, b) => b.date.localeCompare(a.date)));

      // Try to extract files from treatment history
      try {
        const th = await getTreatmentHistory(id);
        if (th.ok && th.data?.timeline) {
          const extracted: PatientFile[] = [];
          for (const entry of th.data.timeline as Record<string, unknown>[]) {
            if (entry.files && Array.isArray(entry.files)) {
              extracted.push(...(entry.files as PatientFile[]));
            }
          }
          setFiles(extracted);
        }
      } catch {
        // files are optional
      }
    } catch {
      showToast('Kundin nicht gefunden', 'error');
      router.push('/dashboard/kunden');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    loadCustomer();
  }, [loadCustomer]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(
      () => showToast(`${label} kopiert`, 'success'),
      () => showToast('Kopieren fehlgeschlagen', 'error')
    );
  };

  if (loading) {
    return (
      <div>
        <div className="mb-6 flex items-center gap-3">
          <Skeleton className="h-5 w-5" />
          <SkeletonText className="w-40" />
        </div>
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-14 w-14 rounded-full" />
            <SkeletonText className="w-48" />
            <SkeletonText className="w-32" />
          </div>
          <div className="lg:col-span-3 space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!customer) return null;

  const fullName = `${customer.first_name} ${customer.last_name}`;

  return (
    <div>
      {/* Back button */}
      <button
        onClick={() => router.push('/dashboard/kunden')}
        className="mb-6 flex items-center gap-1.5 text-sm text-foreground/50 transition-colors hover:text-foreground"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
        Zurück zur Kundenliste
      </button>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left column: Customer info */}
        <div className="lg:col-span-2">
          <Card className="sticky top-8">
            <div className="flex flex-col items-center text-center">
              <Avatar name={fullName} size="lg" className="h-20 w-20 text-2xl" />
              <h1 className="mt-4 font-serif text-xl font-semibold text-foreground">
                {fullName}
              </h1>
              {customer.location && (
                <Badge className="mt-2">
                  {locationLabel[customer.location] || customer.location}
                </Badge>
              )}
            </div>

            {/* Contact info */}
            <div className="mt-6 space-y-3">
              {customer.phone && (
                <button
                  onClick={() => copyToClipboard(customer.phone!, 'Telefonnummer')}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                >
                  <svg className="shrink-0 text-foreground/40" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <span className="text-foreground/70">{customer.phone}</span>
                  <svg className="ml-auto shrink-0 text-foreground/30" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                  </svg>
                </button>
              )}
              {customer.email && (
                <button
                  onClick={() => copyToClipboard(customer.email!, 'E-Mail')}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                >
                  <svg className="shrink-0 text-foreground/40" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  <span className="truncate text-foreground/70">{customer.email}</span>
                  <svg className="ml-auto shrink-0 text-foreground/30" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                  </svg>
                </button>
              )}
              {customer.date_of_birth && (
                <div className="flex items-center gap-3 px-3 py-2 text-sm">
                  <svg className="shrink-0 text-foreground/40" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 2v4M16 2v4" />
                    <rect width="18" height="18" x="3" y="4" rx="2" />
                    <path d="M3 10h18" />
                  </svg>
                  <span className="text-foreground/70">
                    {formatDate(customer.date_of_birth)}
                  </span>
                </div>
              )}
            </div>

            {/* Tags */}
            {customer.tags && customer.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5 px-3">
                {customer.tags.map((tag) => (
                  <Badge key={tag} variant="info">{tag}</Badge>
                ))}
              </div>
            )}

            {/* Notes */}
            {customer.notes && (
              <div className="mt-4 rounded-lg bg-muted px-3 py-2">
                <p className="text-xs font-medium text-foreground/50">Notizen</p>
                <p className="mt-1 text-sm text-foreground/70 leading-relaxed">
                  {customer.notes}
                </p>
              </div>
            )}

            {/* Meta */}
            <p className="mt-4 px-3 text-xs text-foreground/40">
              Kundin seit {formatDate(customer.created_at)}
            </p>

            {/* Stats */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted px-3 py-2 text-center">
                <p className="text-lg font-semibold text-foreground">{totalAppointments}</p>
                <p className="text-xs text-foreground/50">Termine</p>
              </div>
              <div className="rounded-lg bg-muted px-3 py-2 text-center">
                <p className="text-lg font-semibold text-foreground">
                  {totalRevenue.toLocaleString('de-DE', { minimumFractionDigits: 0 })} &euro;
                </p>
                <p className="text-xs text-foreground/50">Umsatz</p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-5 flex flex-col gap-2">
              <Button onClick={() => setShowEdit(true)} variant="outline" className="w-full">
                <svg className="mr-1.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                </svg>
                Bearbeiten
              </Button>
              <Button onClick={() => setShowTreatmentLog(true)} className="w-full">
                <svg className="mr-1.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Behandlung loggen
              </Button>
              {customer.email && (
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => window.open(`mailto:${customer.email}`, '_blank')}
                >
                  <svg className="mr-1.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  E-Mail senden
                </Button>
              )}
            </div>
          </Card>
        </div>

        {/* Right column: Tabs */}
        <div className="lg:col-span-3">
          <Card>
            <Tabs
              tabs={[
                {
                  id: 'treatments',
                  label: 'Behandlungen',
                  content: (
                    <TreatmentTimeline
                      customerId={id}
                      refreshKey={treatmentRefreshKey}
                    />
                  ),
                },
                {
                  id: 'appointments',
                  label: 'Termine',
                  content: (
                    <AppointmentsList appointments={appointments} />
                  ),
                },
                {
                  id: 'files',
                  label: 'Dateien',
                  content: <FilesList files={files} />,
                },
              ]}
              defaultTab="treatments"
            />
          </Card>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        title="Kundin bearbeiten"
        size="lg"
      >
        <CustomerForm
          customer={customer}
          onSuccess={(updated) => {
            setCustomer(updated);
            setShowEdit(false);
          }}
          onCancel={() => setShowEdit(false)}
        />
      </Modal>

      {/* Treatment Log Modal */}
      <TreatmentLogModal
        open={showTreatmentLog}
        onClose={() => {
          setShowTreatmentLog(false);
          setTreatmentRefreshKey((k) => k + 1);
        }}
        customerId={id}
        customerName={fullName}
      />
    </div>
  );
}

// ---- Sub-components ----

function AppointmentsList({ appointments }: { appointments: Appointment[] }) {
  if (appointments.length === 0) {
    return (
      <EmptyState
        icon={
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 2v4M16 2v4" />
            <rect width="18" height="18" x="3" y="4" rx="2" />
            <path d="M3 10h18" />
          </svg>
        }
        title="Keine Termine"
        description="Noch keine Termine vorhanden."
      />
    );
  }

  return (
    <div className="divide-y divide-border/50">
      {appointments.map((appt) => {
        const cfg = statusConfig[appt.status] || statusConfig.confirmed;
        return (
          <div key={appt.id} className="flex items-center gap-4 py-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                {appt.treatment?.name || 'Termin'}
              </p>
              <p className="mt-0.5 text-xs text-foreground/50">
                {formatDate(appt.date)} · {appt.start_time?.slice(0, 5)} - {appt.end_time?.slice(0, 5)}
                {appt.location && ` · ${locationLabel[appt.location] || appt.location}`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {appt.price_eur != null && (
                <span className="text-sm text-foreground/60">
                  {appt.price_eur.toLocaleString('de-DE')} &euro;
                </span>
              )}
              <Badge variant={cfg.variant}>{cfg.label}</Badge>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FilesList({ files }: { files: PatientFile[] }) {
  if (files.length === 0) {
    return (
      <EmptyState
        icon={
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
            <path d="M14 2v4a2 2 0 0 0 2 2h4" />
          </svg>
        }
        title="Keine Dateien"
        description="Noch keine Dateien vorhanden."
      />
    );
  }

  const fileTypeLabels: Record<string, string> = {
    photo: 'Foto',
    consent_form: 'Einwilligung',
    lab_result: 'Laborbefund',
    document: 'Dokument',
    before_after: 'Vorher/Nachher',
  };

  return (
    <div className="divide-y divide-border/50">
      {files.map((file) => (
        <div key={file.id} className="flex items-center gap-3 py-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            <svg className="text-foreground/40" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
              <path d="M14 2v4a2 2 0 0 0 2 2h4" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {file.original_filename || file.description || 'Datei'}
            </p>
            <p className="text-xs text-foreground/50">
              {fileTypeLabels[file.file_type] || file.file_type}
              {file.created_at && ` · ${formatDate(file.created_at)}`}
            </p>
          </div>
          {file.signed_url && (
            <a
              href={file.signed_url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-sm text-primary hover:underline"
            >
              Ansehen
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

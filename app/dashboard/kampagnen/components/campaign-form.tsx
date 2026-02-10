'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getEmailTemplates, getSupabaseClient, sendCampaign } from '@/lib/api';
import { showToast } from '@/hooks/use-toast';
import type { EmailTemplate } from '@/lib/types';

interface CampaignFormProps {
  onClose: () => void;
  onCreated: () => void;
}

type Step = 1 | 2 | 3 | 4;

const STEP_LABELS: Record<Step, string> = {
  1: 'Grunddaten',
  2: 'Inhalt',
  3: 'Zielgruppe',
  4: 'Vorschau & Senden',
};

function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<object[\s\S]*?<\/object>/gi, '')
    .replace(/<embed[\s\S]*?>/gi, '')
    .replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\bon\w+\s*=\s*[^\s>]*/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/data\s*:[^,]*;base64/gi, '');
}

export const CampaignForm = ({ onClose, onCreated }: CampaignFormProps) => {
  const [step, setStep] = useState<Step>(1);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [sending, setSending] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [recipientCount, setRecipientCount] = useState<number | null>(null);

  // Step 1
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');

  // Step 2
  const [contentMode, setContentMode] = useState<'template' | 'custom'>('template');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [customHtml, setCustomHtml] = useState('');

  // Step 3
  const [locationFilter, setLocationFilter] = useState('all');
  const [onlyOptIn, setOnlyOptIn] = useState(true);

  useEffect(() => {
    getEmailTemplates()
      .then(setTemplates)
      .catch(() => showToast('Templates konnten nicht geladen werden', 'error'));
  }, []);

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  const canProceed = (): boolean => {
    switch (step) {
      case 1:
        return name.trim().length > 0 && subject.trim().length > 0;
      case 2:
        return contentMode === 'template'
          ? selectedTemplateId.length > 0
          : customHtml.trim().length > 0;
      case 3:
        return true;
      default:
        return true;
    }
  };

  const buildCampaignPayload = () => {
    const segmentFilter: Record<string, unknown> = {};
    if (locationFilter !== 'all') segmentFilter.location = locationFilter;
    if (onlyOptIn) segmentFilter.email_opt_in = true;

    const rawHtml =
      contentMode === 'template' && selectedTemplate
        ? selectedTemplate.body_html
        : customHtml;
    const bodyHtml = rawHtml ? sanitizeHtml(rawHtml) : rawHtml;

    return {
      name,
      subject,
      body_html: bodyHtml,
      template_id: contentMode === 'template' ? selectedTemplateId : null,
      segment_filter: segmentFilter,
      status: 'draft' as const,
    };
  };

  const handleSaveDraft = async () => {
    setSavingDraft(true);
    try {
      const supabase = getSupabaseClient();
      const payload = buildCampaignPayload();

      const { error: insertError } = await supabase
        .schema('crm')
        .from('campaigns')
        .insert(payload)
        .select()
        .single();

      if (insertError) throw insertError;

      showToast('Entwurf gespeichert', 'success');
      onCreated();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Fehler beim Speichern',
        'error'
      );
    } finally {
      setSavingDraft(false);
    }
  };

  const handleConfirmSend = async () => {
    // Estimate recipients
    try {
      const supabase = getSupabaseClient();
      let query = supabase.schema('crm').from('customers').select('id', { count: 'exact', head: true });
      if (locationFilter !== 'all') query = query.eq('location', locationFilter);
      if (onlyOptIn) query = query.eq('email_opt_in', true);
      query = query.not('email', 'is', null);
      const { count } = await query;
      setRecipientCount(count ?? 0);
    } catch {
      setRecipientCount(null);
    }
    setShowConfirm(true);
  };

  const handleSend = async () => {
    setShowConfirm(false);
    setSending(true);
    try {
      const supabase = getSupabaseClient();
      const payload = buildCampaignPayload();

      const { data: campaign, error: insertError } = await supabase
        .schema('crm')
        .from('campaigns')
        .insert(payload)
        .select()
        .single();

      if (insertError) throw insertError;

      const result = await sendCampaign(campaign.id);
      if (!result.ok) throw new Error(result.error || 'Senden fehlgeschlagen');

      showToast('Kampagne wird gesendet!', 'success');
      onCreated();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Fehler beim Senden',
        'error'
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {([1, 2, 3, 4] as Step[]).map((s) => (
          <div key={s} className="flex items-center gap-2">
            <button
              onClick={() => s < step && setStep(s)}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                s === step
                  ? 'bg-primary text-white'
                  : s < step
                    ? 'bg-primary/20 text-primary cursor-pointer'
                    : 'bg-muted text-foreground/40'
              }`}
            >
              {s}
            </button>
            <span
              className={`hidden text-xs sm:inline ${
                s === step ? 'font-medium text-foreground' : 'text-foreground/40'
              }`}
            >
              {STEP_LABELS[s]}
            </span>
            {s < 4 && (
              <div className="mx-1 h-px w-6 bg-border" />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card>
        {step === 1 && (
          <div className="space-y-4">
            <Input
              label="Kampagnenname"
              placeholder="z.B. Fruehjahrs-Aktion 2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              label="E-Mail-Betreff"
              placeholder="z.B. Dein exklusives Angebot wartet!"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={contentMode === 'template' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setContentMode('template')}
              >
                Template waehlen
              </Button>
              <Button
                variant={contentMode === 'custom' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setContentMode('custom')}
              >
                Eigener Text
              </Button>
            </div>

            {contentMode === 'template' ? (
              <div className="space-y-2">
                {templates.length === 0 ? (
                  <p className="text-sm text-foreground/50">
                    Keine Templates vorhanden.
                  </p>
                ) : (
                  templates.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTemplateId(t.id)}
                      className={`w-full rounded-lg border p-3 text-left text-sm transition-colors ${
                        selectedTemplateId === t.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{t.name}</span>
                        <Badge variant={t.template_type === 'marketing' ? 'info' : 'default'}>
                          {t.template_type}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-foreground/50">{t.subject}</p>
                    </button>
                  ))
                )}
              </div>
            ) : (
              <Textarea
                label="HTML-Inhalt"
                placeholder="<h1>Hallo {{first_name}},</h1><p>..."
                value={customHtml}
                onChange={(e) => setCustomHtml(e.target.value)}
                className="min-h-[200px] font-mono text-xs"
              />
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium text-foreground/70">
                Standort-Filter
              </p>
              <div className="flex gap-2">
                {[
                  { value: 'all', label: 'Alle Standorte' },
                  { value: 'neumarkt', label: 'Nur Neumarkt' },
                  { value: 'kw', label: 'Nur KW' },
                ].map((loc) => (
                  <Button
                    key={loc.value}
                    variant={locationFilter === loc.value ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setLocationFilter(loc.value)}
                  >
                    {loc.label}
                  </Button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={onlyOptIn}
                onChange={(e) => setOnlyOptIn(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary accent-primary"
              />
              <span className="text-sm text-foreground/70">
                Nur Kundinnen mit E-Mail-Opt-in
              </span>
            </label>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h3 className="font-serif text-base font-semibold">Zusammenfassung</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-foreground/50">Name</span>
                <span className="font-medium">{name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground/50">Betreff</span>
                <span className="font-medium">{subject}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground/50">Inhalt</span>
                <span className="font-medium">
                  {contentMode === 'template'
                    ? selectedTemplate?.name || 'Template'
                    : 'Eigener Text'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground/50">Standort</span>
                <span className="font-medium">
                  {locationFilter === 'all'
                    ? 'Alle'
                    : locationFilter === 'neumarkt'
                      ? 'Neumarkt'
                      : 'KW'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground/50">Nur Opt-in</span>
                <span className="font-medium">{onlyOptIn ? 'Ja' : 'Nein'}</span>
              </div>
            </div>

            {/* HTML Preview */}
            {(contentMode === 'custom' && customHtml) ||
            (contentMode === 'template' && selectedTemplate?.body_html) ? (
              <div className="rounded-lg border border-border bg-white p-4">
                <p className="mb-2 text-xs font-medium text-foreground/50">Vorschau</p>
                <div
                  className="prose prose-sm max-h-60 overflow-y-auto"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(
                      contentMode === 'custom'
                        ? customHtml
                        : selectedTemplate?.body_html || ''
                    ),
                  }}
                />
              </div>
            ) : null}
          </div>
        )}
      </Card>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="font-serif text-lg font-semibold text-foreground">
              Kampagne senden?
            </h3>
            <p className="mt-2 text-sm text-foreground/60">
              {recipientCount !== null
                ? `Kampagne an ${recipientCount} Empfaenger senden?`
                : 'Kampagne wirklich senden?'}
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowConfirm(false)}
              >
                Abbrechen
              </Button>
              <Button
                size="sm"
                disabled={sending}
                onClick={handleSend}
              >
                {sending ? 'Wird gesendet...' : 'Senden'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button variant="ghost" onClick={step === 1 ? onClose : () => setStep((step - 1) as Step)}>
          {step === 1 ? 'Abbrechen' : 'Zurueck'}
        </Button>
        <div className="flex gap-2">
          {step < 4 ? (
            <Button
              disabled={!canProceed()}
              onClick={() => setStep((step + 1) as Step)}
            >
              Weiter
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                disabled={savingDraft || sending}
                onClick={handleSaveDraft}
              >
                {savingDraft ? 'Speichert...' : 'Als Entwurf speichern'}
              </Button>
              <Button
                disabled={sending || savingDraft}
                onClick={handleConfirmSend}
              >
                {sending ? 'Wird gesendet...' : 'Kampagne senden'}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

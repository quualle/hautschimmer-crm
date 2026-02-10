'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { logTreatment, getAppointments } from '@/lib/api';
import { showToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';
import type { Appointment } from '@/lib/types';

interface TreatmentLogModalProps {
  open: boolean;
  onClose: () => void;
  customerId: string;
  customerName: string;
}

export const TreatmentLogModal = ({
  open,
  onClose,
  customerId,
  customerName,
}: TreatmentLogModalProps) => {
  const [saving, setSaving] = useState(false);
  const [openAppointments, setOpenAppointments] = useState<Appointment[]>([]);
  const [form, setForm] = useState({
    notes: '',
    note_type: 'treatment',
    appointment_id: '',
    follow_up_needed: false,
    follow_up_date: '',
  });

  useEffect(() => {
    if (open) {
      setForm({
        notes: '',
        note_type: 'treatment',
        appointment_id: '',
        follow_up_needed: false,
        follow_up_date: '',
      });
      getAppointments({ customer_id: customerId })
        .then((appts) => {
          setOpenAppointments(
            appts.filter((a) => a.status === 'confirmed' || a.status === 'completed')
          );
        })
        .catch(() => setOpenAppointments([]));
    }
  }, [open, customerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.notes.trim()) {
      showToast('Bitte Notizen eingeben', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload: Parameters<typeof logTreatment>[0] = {
        customer_id: customerId,
        notes: form.notes.trim(),
        note_type: form.note_type,
        source: 'manual',
      };
      if (form.appointment_id) payload.appointment_id = form.appointment_id;
      if (form.follow_up_needed && form.follow_up_date) {
        payload.treatment_details = {
          follow_up_needed: true,
          follow_up_date: form.follow_up_date,
        };
      }

      const result = await logTreatment(payload);
      if (result.ok) {
        showToast('Behandlung dokumentiert', 'success');
        onClose();
      } else {
        showToast(result.error || 'Fehler beim Speichern', 'error');
      }
    } catch {
      showToast('Fehler beim Speichern', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Behandlung loggen — ${customerName}`} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          id="note_type"
          label="Art"
          value={form.note_type}
          onChange={(e) => setForm((p) => ({ ...p, note_type: e.target.value }))}
          options={[
            { value: 'treatment', label: 'Behandlung' },
            { value: 'consultation', label: 'Beratung' },
            { value: 'follow_up', label: 'Nachsorge' },
            { value: 'general', label: 'Allgemein' },
            { value: 'consent_form', label: 'Einwilligung' },
          ]}
        />

        <Textarea
          id="notes"
          label="Notizen *"
          value={form.notes}
          onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
          placeholder="Behandlungsdetails, Beobachtungen, Empfehlungen..."
          rows={4}
        />

        {openAppointments.length > 0 && (
          <Select
            id="appointment_id"
            label="Termin zuordnen"
            value={form.appointment_id}
            onChange={(e) =>
              setForm((p) => ({ ...p, appointment_id: e.target.value }))
            }
            placeholder="Optional: Termin auswählen"
            options={openAppointments.map((a) => ({
              value: a.id,
              label: `${formatDate(a.date)} — ${a.treatment?.name || 'Termin'}`,
            }))}
          />
        )}

        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground/70">
            <input
              type="checkbox"
              checked={form.follow_up_needed}
              onChange={(e) =>
                setForm((p) => ({ ...p, follow_up_needed: e.target.checked }))
              }
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            Follow-up nötig
          </label>
        </div>

        {form.follow_up_needed && (
          <Input
            id="follow_up_date"
            label="Follow-up Datum"
            type="date"
            value={form.follow_up_date}
            onChange={(e) =>
              setForm((p) => ({ ...p, follow_up_date: e.target.value }))
            }
          />
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
            Abbrechen
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Speichert...' : 'Dokumentieren'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

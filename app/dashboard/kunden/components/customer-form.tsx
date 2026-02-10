'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { upsertCustomer } from '@/lib/api';
import { showToast } from '@/hooks/use-toast';
import type { Customer } from '@/lib/types';

interface CustomerFormProps {
  customer?: Customer | null;
  onSuccess: (customer: Customer) => void;
  onCancel: () => void;
}

export const CustomerForm = ({ customer, onSuccess, onCancel }: CustomerFormProps) => {
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    first_name: customer?.first_name || '',
    last_name: customer?.last_name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    date_of_birth: customer?.date_of_birth || '',
    location: customer?.location || '',
    notes: customer?.notes || '',
  });

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!form.first_name.trim()) next.first_name = 'Vorname ist erforderlich';
    if (!form.last_name.trim()) next.last_name = 'Nachname ist erforderlich';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const payload: Partial<Customer> = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        date_of_birth: form.date_of_birth || null,
        location: (form.location as Customer['location']) || null,
        notes: form.notes.trim() || null,
      };
      if (customer?.id) payload.id = customer.id;

      const result = await upsertCustomer(payload);
      if (result.ok && result.customer) {
        showToast(
          customer?.id ? 'Kundin aktualisiert' : 'Neue Kundin angelegt',
          'success'
        );
        onSuccess(result.customer);
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          id="first_name"
          label="Vorname *"
          value={form.first_name}
          onChange={(e) => update('first_name', e.target.value)}
          error={errors.first_name}
          placeholder="Vorname"
        />
        <Input
          id="last_name"
          label="Nachname *"
          value={form.last_name}
          onChange={(e) => update('last_name', e.target.value)}
          error={errors.last_name}
          placeholder="Nachname"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          id="email"
          label="E-Mail"
          type="email"
          value={form.email}
          onChange={(e) => update('email', e.target.value)}
          placeholder="email@beispiel.de"
        />
        <Input
          id="phone"
          label="Telefon"
          type="tel"
          value={form.phone}
          onChange={(e) => update('phone', e.target.value)}
          placeholder="+49 ..."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          id="date_of_birth"
          label="Geburtsdatum"
          type="date"
          value={form.date_of_birth}
          onChange={(e) => update('date_of_birth', e.target.value)}
        />
        <Select
          id="location"
          label="Standort"
          value={form.location}
          onChange={(e) => update('location', e.target.value)}
          placeholder="Standort wählen"
          options={[
            { value: 'neumarkt', label: 'Neumarkt' },
            { value: 'kw', label: 'Königstein-Wernberg' },
          ]}
        />
      </div>

      <Textarea
        id="notes"
        label="Notizen"
        value={form.notes}
        onChange={(e) => update('notes', e.target.value)}
        placeholder="Allergien, besondere Hinweise..."
        rows={3}
      />

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
          Abbrechen
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Speichert...' : customer?.id ? 'Aktualisieren' : 'Anlegen'}
        </Button>
      </div>
    </form>
  );
};

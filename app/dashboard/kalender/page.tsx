'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { Modal } from '@/components/ui/modal';
import { SkeletonCard } from '@/components/ui/skeleton';
import { getAppointments } from '@/lib/api';
import type { Appointment } from '@/lib/types';

// ========== Helpers ==========

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 08:00 - 20:00
const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

const formatDateISO = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const formatDateHeader = (d: Date): string =>
  d.toLocaleDateString('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

const formatTimeSlot = (time: string): string => time.slice(0, 5);

const addDays = (d: Date, n: number): Date => {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
};

const getWeekStart = (d: Date): Date => {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const start = new Date(d);
  start.setDate(start.getDate() + diff);
  return start;
};

const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

const locationLabel = (loc: string): string =>
  loc === 'kw' ? 'KW' : 'Neumarkt';

const statusLabel: Record<string, string> = {
  confirmed: 'Bestaetigt',
  completed: 'Abgeschlossen',
  cancelled: 'Storniert',
  no_show: 'Nicht erschienen',
};

const statusVariant = (
  status: string
): 'success' | 'default' | 'danger' | 'warning' => {
  switch (status) {
    case 'completed':
      return 'success';
    case 'confirmed':
      return 'default';
    case 'cancelled':
      return 'danger';
    case 'no_show':
      return 'warning';
    default:
      return 'default';
  }
};

const statusColor = (status: string): string => {
  switch (status) {
    case 'confirmed':
      return 'bg-primary/15 border-primary/40 text-foreground';
    case 'completed':
      return 'bg-success/10 border-success/40 text-foreground';
    case 'cancelled':
      return 'bg-danger/10 border-danger/40 text-foreground line-through opacity-60';
    case 'no_show':
      return 'bg-amber-50 border-amber-300 text-foreground opacity-60';
    default:
      return 'bg-muted border-border text-foreground';
  }
};

// ========== Icons ==========

const ChevronLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18l6-6-6-6" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);

// ========== Appointment Detail Modal ==========

const AppointmentDetail = ({
  appointment,
  onClose,
}: {
  appointment: Appointment;
  onClose: () => void;
}) => (
  <Modal open onClose={onClose} title="Termindetails" size="sm">
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Avatar name={appointment.customer?.first_name + ' ' + appointment.customer?.last_name} size="sm" />
        <div>
          <Link
            href={`/dashboard/kunden/${appointment.customer_id}`}
            className="text-sm font-medium text-foreground hover:text-primary"
          >
            {appointment.customer?.first_name} {appointment.customer?.last_name}
          </Link>
          <p className="text-xs text-foreground/50">
            {appointment.customer?.phone || appointment.customer?.email || ''}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-foreground/50">Behandlung</p>
          <p className="font-medium">{appointment.treatment?.name || 'Unbekannt'}</p>
        </div>
        <div>
          <p className="text-foreground/50">Status</p>
          <Badge variant={statusVariant(appointment.status)}>
            {statusLabel[appointment.status] || appointment.status}
          </Badge>
        </div>
        <div>
          <p className="text-foreground/50">Uhrzeit</p>
          <p className="font-medium">
            {formatTimeSlot(appointment.start_time)} - {formatTimeSlot(appointment.end_time)}
          </p>
        </div>
        <div>
          <p className="text-foreground/50">Dauer</p>
          <p className="font-medium">{appointment.duration_minutes} Min</p>
        </div>
        <div>
          <p className="text-foreground/50">Standort</p>
          <p className="font-medium">{locationLabel(appointment.location)}</p>
        </div>
        {appointment.price_eur != null && (
          <div>
            <p className="text-foreground/50">Preis</p>
            <p className="font-medium">{appointment.price_eur} EUR</p>
          </div>
        )}
      </div>
    </div>
  </Modal>
);

// ========== Day View ==========

const DayView = ({
  appointments,
  onSelect,
}: {
  appointments: Appointment[];
  onSelect: (a: Appointment) => void;
}) => {
  const pixelsPerHour = 80;

  return (
    <div className="relative" style={{ height: HOURS.length * pixelsPerHour }}>
      {/* Hour grid lines */}
      {HOURS.map((hour) => (
        <div
          key={hour}
          className="absolute left-0 right-0 border-t border-border/50"
          style={{ top: (hour - 8) * pixelsPerHour }}
        >
          <span className="absolute -top-3 left-0 w-12 text-right text-xs text-foreground/40">
            {String(hour).padStart(2, '0')}:00
          </span>
        </div>
      ))}

      {/* Appointments */}
      {appointments.map((apt) => {
        const startMin = timeToMinutes(apt.start_time) - 8 * 60;
        const endMin = timeToMinutes(apt.end_time) - 8 * 60;
        const top = (startMin / 60) * pixelsPerHour;
        const height = Math.max(((endMin - startMin) / 60) * pixelsPerHour, 28);

        return (
          <button
            key={apt.id}
            onClick={() => onSelect(apt)}
            className={`absolute left-14 right-2 rounded-lg border px-3 py-1.5 text-left transition-shadow hover:shadow-md ${statusColor(apt.status)}`}
            style={{ top, height, minHeight: 28 }}
          >
            <p className="truncate text-xs font-medium">
              {formatTimeSlot(apt.start_time)} {apt.customer?.first_name} {apt.customer?.last_name}
            </p>
            {height > 40 && (
              <p className="truncate text-xs text-foreground/50">
                {apt.treatment?.name || 'Behandlung'} &middot; {apt.duration_minutes} Min
              </p>
            )}
          </button>
        );
      })}
    </div>
  );
};

// ========== Week View ==========

const WeekView = ({
  weekStart,
  appointmentsByDate,
  onSelect,
}: {
  weekStart: Date;
  appointmentsByDate: Record<string, Appointment[]>;
  onSelect: (a: Appointment) => void;
}) => {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="grid grid-cols-7 gap-1">
      {days.map((day, i) => {
        const dateStr = formatDateISO(day);
        const dayAppts = appointmentsByDate[dateStr] || [];
        const isToday = formatDateISO(day) === formatDateISO(new Date());

        return (
          <div key={dateStr} className="min-h-[200px]">
            <div
              className={`mb-2 rounded-lg px-2 py-1 text-center text-xs font-medium ${
                isToday
                  ? 'bg-primary text-white'
                  : 'text-foreground/50'
              }`}
            >
              <span className="block">{WEEKDAYS[i]}</span>
              <span className="block text-sm">{day.getDate()}</span>
            </div>
            <div className="space-y-1">
              {dayAppts.map((apt) => (
                <button
                  key={apt.id}
                  onClick={() => onSelect(apt)}
                  className={`w-full rounded-md border px-1.5 py-1 text-left text-[10px] leading-tight transition-shadow hover:shadow-md ${statusColor(apt.status)}`}
                >
                  <span className="font-medium">{formatTimeSlot(apt.start_time)}</span>
                  <span className="block truncate">
                    {apt.customer?.first_name} {apt.customer?.last_name?.charAt(0)}.
                  </span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ========== Main Page ==========

export default function KalenderPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [view, setView] = useState<'day' | 'week'>('day');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [appointments, setAppointments] = useState<Appointment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // For week view we need to load the whole week
  const weekStart = useMemo(() => getWeekStart(selectedDate), [selectedDate]);

  useEffect(() => {
    const load = async () => {
      setError(null);
      try {
        if (view === 'day') {
          const data = await getAppointments({
            date: formatDateISO(selectedDate),
            location: locationFilter !== 'all' ? locationFilter : undefined,
          });
          setAppointments(data);
        } else {
          // Load whole week
          const promises = Array.from({ length: 7 }, (_, i) => {
            const day = addDays(weekStart, i);
            return getAppointments({
              date: formatDateISO(day),
              location: locationFilter !== 'all' ? locationFilter : undefined,
            });
          });
          const results = await Promise.all(promises);
          setAppointments(results.flat());
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Fehler beim Laden');
      }
    };
    load();
  }, [selectedDate, view, locationFilter, weekStart]);

  const appointmentsByDate = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    appointments?.forEach((a) => {
      if (!map[a.date]) map[a.date] = [];
      map[a.date].push(a);
    });
    return map;
  }, [appointments]);

  const todayAppts = appointmentsByDate[formatDateISO(selectedDate)] || [];
  const isToday =
    formatDateISO(selectedDate) === formatDateISO(new Date());

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-foreground">
            Kalender
          </h1>
          <p className="mt-1 text-sm text-foreground/50">
            {formatDateHeader(selectedDate)}
          </p>
        </div>

        {/* View Toggle (hidden on mobile) */}
        <div className="hidden items-center gap-2 sm:flex">
          <Button
            variant={view === 'day' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setView('day')}
          >
            Tag
          </Button>
          <Button
            variant={view === 'week' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setView('week')}
          >
            Woche
          </Button>
        </div>
      </div>

      {/* Navigation Bar */}
      <Card padding="sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Date Navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDate(addDays(selectedDate, view === 'week' ? -7 : -1))}
            >
              <ChevronLeftIcon />
            </Button>
            {!isToday && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDate(new Date())}
              >
                Heute
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDate(addDays(selectedDate, view === 'week' ? 7 : 1))}
            >
              <ChevronRightIcon />
            </Button>
            <input
              type="date"
              value={formatDateISO(selectedDate)}
              onChange={(e) => setSelectedDate(new Date(e.target.value + 'T12:00:00'))}
              className="rounded-lg border border-border bg-muted px-3 py-1.5 text-sm outline-none focus:border-primary"
            />
          </div>

          {/* Location Filter */}
          <div className="flex items-center gap-1">
            {[
              { value: 'all', label: 'Alle' },
              { value: 'neumarkt', label: 'Neumarkt' },
              { value: 'kw', label: 'KW' },
            ].map((loc) => (
              <Button
                key={loc.value}
                variant={locationFilter === loc.value ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setLocationFilter(loc.value)}
              >
                {loc.label}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Error */}
      {error && (
        <Card className="border-danger/30 bg-danger/5 text-danger text-sm">
          {error}
        </Card>
      )}

      {/* Calendar Content */}
      <Card>
        {appointments === null ? (
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : view === 'day' ? (
          todayAppts.length === 0 ? (
            <EmptyState
              icon={<CalendarIcon />}
              title="Keine Termine an diesem Tag"
              description="Waehle ein anderes Datum oder erstelle einen neuen Termin."
            />
          ) : (
            <DayView
              appointments={todayAppts}
              onSelect={setSelectedAppointment}
            />
          )
        ) : (
          <WeekView
            weekStart={weekStart}
            appointmentsByDate={appointmentsByDate}
            onSelect={setSelectedAppointment}
          />
        )}
      </Card>

      {/* Appointment Detail Modal */}
      {selectedAppointment && (
        <AppointmentDetail
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
        />
      )}
    </div>
  );
}

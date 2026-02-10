"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  searchCustomers,
  getTreatments,
  getAppointments,
} from "@/lib/api";
import type { CustomerSearchResult, Treatment, Appointment } from "@/lib/types";
import { showToast } from "@/hooks/use-toast";

type Step = 1 | 2 | 3 | 4;

interface SelectedData {
  customer: CustomerSearchResult | null;
  treatment: Treatment | null;
  date: string | null;
  time: string | null;
}

const STEP_LABELS = ["Kundin", "Behandlung", "Termin", "Bestaetigung"];

// Generate next 14 days
function getNext14Days(): { label: string; value: string; weekday: string }[] {
  const days: { label: string; value: string; weekday: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const value = d.toISOString().split("T")[0];
    const weekday = d.toLocaleDateString("de-DE", { weekday: "short" });
    const label = d.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
    });
    days.push({ label, value, weekday });
  }
  return days;
}

// Generate time slots from 09:00 to 19:00 in 30-min steps
function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 9; h <= 19; h++) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
    if (h < 19) {
      slots.push(`${String(h).padStart(2, "0")}:30`);
    }
  }
  return slots;
}

export const BookingWizard = () => {
  const [step, setStep] = useState<Step>(1);
  const [selected, setSelected] = useState<SelectedData>({
    customer: null,
    treatment: null,
    date: null,
    time: null,
  });

  // Step 1: Customer search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CustomerSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Step 2: Treatments
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [treatmentsLoading, setTreatmentsLoading] = useState(false);

  // Step 3: Date & time
  const [dayAppointments, setDayAppointments] = useState<Appointment[]>([]);

  // Step 4: Booking
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);

  // Search customers with debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const results = await searchCustomers(searchQuery);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      }
      setSearchLoading(false);
    }, 300);
  }, [searchQuery]);

  // Load treatments when entering step 2, filtered by location
  useEffect(() => {
    if (step === 2 && treatments.length === 0) {
      setTreatmentsLoading(true);
      const currentLocation = sessionStorage.getItem("salon_location") || "neumarkt";
      getTreatments()
        .then((all) => {
          const filtered = all.filter(
            (t) => !t.available_at || t.available_at.length === 0 || t.available_at.includes(currentLocation)
          );
          setTreatments(filtered);
        })
        .catch(() => showToast("Behandlungen konnten nicht geladen werden", "error"))
        .finally(() => setTreatmentsLoading(false));
    }
  }, [step, treatments.length]);

  // Load booked appointments when date changes (for blocking slots)
  useEffect(() => {
    if (!selected.date) return;
    const location = sessionStorage.getItem("salon_location") || "neumarkt";
    getAppointments({ date: selected.date, location })
      .then(setDayAppointments)
      .catch(() => setDayAppointments([]));
  }, [selected.date]);

  const isSlotBlocked = (time: string): boolean => {
    if (!selected.treatment) return false;
    const duration = selected.treatment.duration_minutes;
    const [slotH, slotM] = time.split(":").map(Number);
    const slotStart = slotH * 60 + slotM;
    const slotEnd = slotStart + duration;

    return dayAppointments.some((apt) => {
      if (apt.status === "cancelled") return false;
      const [aH, aM] = apt.start_time.split(":").map(Number);
      const [eH, eM] = apt.end_time.split(":").map(Number);
      const aptStart = aH * 60 + aM;
      const aptEnd = eH * 60 + eM;
      return slotStart < aptEnd && slotEnd > aptStart;
    });
  };

  const handleBook = async () => {
    if (!selected.customer || !selected.treatment || !selected.date || !selected.time) return;
    setBooking(true);
    try {
      const location = sessionStorage.getItem("salon_location") || "neumarkt";
      const sessionToken = sessionStorage.getItem("salon_token") || "";
      const duration = selected.treatment.duration_minutes;
      const [h, m] = selected.time.split(":").map(Number);
      const endMinutes = h * 60 + m + duration;
      const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

      const res = await fetch(`${supabaseUrl}/functions/v1/salon-book-appointment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseAnonKey,
        },
        body: JSON.stringify({
          session_token: sessionToken,
          customer_id: selected.customer.id,
          treatment_id: selected.treatment.id,
          location,
          date: selected.date,
          start_time: selected.time,
          end_time: endTime,
          duration_minutes: duration,
          price_eur: selected.treatment.price_eur,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Buchung fehlgeschlagen");

      setBooked(true);
      showToast("Termin erfolgreich gebucht", "success");
    } catch {
      showToast("Fehler beim Buchen des Termins", "error");
    }
    setBooking(false);
  };

  const resetWizard = () => {
    setStep(1);
    setSelected({ customer: null, treatment: null, date: null, time: null });
    setSearchQuery("");
    setSearchResults([]);
    setBooked(false);
  };

  // Group treatments by category
  const treatmentsByCategory = treatments.reduce<Record<string, Treatment[]>>(
    (acc, t) => {
      if (!acc[t.category]) acc[t.category] = [];
      acc[t.category].push(t);
      return acc;
    },
    {}
  );

  const days = getNext14Days();
  const timeSlots = generateTimeSlots();

  return (
    <div>
      {/* Step indicators */}
      <div className="mb-6 flex items-center gap-2">
        {STEP_LABELS.map((label, i) => {
          const s = (i + 1) as Step;
          const isActive = step === s;
          const isDone = step > s;
          return (
            <div key={s} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors",
                  isActive && "bg-primary text-white",
                  isDone && "bg-primary/20 text-primary",
                  !isActive && !isDone && "bg-muted text-foreground/30"
                )}
              >
                {isDone ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                ) : (
                  s
                )}
              </div>
              <span
                className={cn(
                  "text-xs",
                  isActive ? "font-medium text-foreground" : "text-foreground/40"
                )}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Step 1: Customer selection */}
      {step === 1 && (
        <div>
          <input
            type="text"
            placeholder="Name oder Telefon suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            className="mb-4 w-full rounded-xl border border-border bg-white px-4 text-base outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            style={{ height: 56 }}
          />
          {searchLoading && (
            <p className="py-4 text-center text-sm text-foreground/50">
              Suche...
            </p>
          )}
          {searchResults.length > 0 && (
            <div className="flex flex-col gap-2">
              {searchResults.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelected((prev) => ({ ...prev, customer: c }));
                    setStep(2);
                  }}
                  className="flex w-full items-center justify-between rounded-xl border border-border bg-white p-4 text-left transition-colors active:bg-muted"
                  style={{ minHeight: 56 }}
                >
                  <div>
                    <p className="text-base font-medium text-foreground">
                      {c.first_name} {c.last_name}
                    </p>
                    <p className="text-sm text-foreground/50">
                      {c.phone || c.email || "Keine Kontaktdaten"}
                    </p>
                  </div>
                  {c.last_appointment_date && (
                    <span className="text-xs text-foreground/40">
                      Zuletzt:{" "}
                      {new Date(c.last_appointment_date).toLocaleDateString("de-DE")}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
          {searchQuery.length >= 2 && !searchLoading && searchResults.length === 0 && (
            <p className="py-8 text-center text-sm text-foreground/50">
              Keine Kundin gefunden
            </p>
          )}
        </div>
      )}

      {/* Step 2: Treatment selection */}
      {step === 2 && (
        <div>
          <button
            onClick={() => setStep(1)}
            className="mb-4 flex items-center gap-1 text-sm text-foreground/50"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Zurueck
          </button>

          {/* Selected customer badge */}
          <div className="mb-4 rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">
            {selected.customer?.first_name} {selected.customer?.last_name}
          </div>

          {treatmentsLoading ? (
            <p className="py-8 text-center text-sm text-foreground/50">
              Behandlungen laden...
            </p>
          ) : (
            Object.entries(treatmentsByCategory).map(([category, items]) => (
              <div key={category} className="mb-6">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground/40">
                  {category}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {items.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setSelected((prev) => ({ ...prev, treatment: t }));
                        setStep(3);
                      }}
                      className={cn(
                        "rounded-xl border bg-white p-3 text-left transition-colors active:bg-muted",
                        selected.treatment?.id === t.id
                          ? "border-primary"
                          : "border-border"
                      )}
                      style={{ minHeight: 56 }}
                    >
                      <p className="text-sm font-medium text-foreground">
                        {t.name}
                      </p>
                      <p className="mt-1 text-xs text-foreground/50">
                        {t.price_eur} EUR &middot; {t.duration_minutes} Min.
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Step 3: Date & time selection */}
      {step === 3 && (
        <div>
          <button
            onClick={() => setStep(2)}
            className="mb-4 flex items-center gap-1 text-sm text-foreground/50"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Zurueck
          </button>

          {/* Context badges */}
          <div className="mb-4 flex gap-2">
            <span className="rounded-lg bg-primary/10 px-3 py-1.5 text-sm text-primary">
              {selected.customer?.first_name} {selected.customer?.last_name}
            </span>
            <span className="rounded-lg bg-accent/10 px-3 py-1.5 text-sm text-accent">
              {selected.treatment?.name}
            </span>
          </div>

          {/* Date picker */}
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground/40">
            Datum
          </h3>
          <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
            {days.map((d) => (
              <button
                key={d.value}
                onClick={() =>
                  setSelected((prev) => ({ ...prev, date: d.value, time: null }))
                }
                className={cn(
                  "flex flex-shrink-0 flex-col items-center rounded-xl border px-3 py-2 transition-colors active:bg-muted",
                  selected.date === d.value
                    ? "border-primary bg-primary/10"
                    : "border-border bg-white"
                )}
                style={{ minWidth: 64, minHeight: 56 }}
              >
                <span className="text-xs text-foreground/50">{d.weekday}</span>
                <span className="text-sm font-medium">{d.label}</span>
              </button>
            ))}
          </div>

          {/* Time slots */}
          {selected.date && (
            <>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground/40">
                Uhrzeit
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {timeSlots.map((slot) => {
                  const blocked = isSlotBlocked(slot);
                  return (
                    <button
                      key={slot}
                      onClick={() => {
                        if (!blocked) {
                          setSelected((prev) => ({ ...prev, time: slot }));
                          setStep(4);
                        }
                      }}
                      disabled={blocked}
                      className={cn(
                        "rounded-xl border py-3 text-center text-sm font-medium transition-colors",
                        blocked && "cursor-not-allowed border-border bg-muted/50 text-foreground/20",
                        !blocked && selected.time === slot && "border-primary bg-primary/10 text-primary",
                        !blocked && selected.time !== slot && "border-border bg-white text-foreground active:bg-muted"
                      )}
                      style={{ minHeight: 48 }}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Step 4: Confirmation */}
      {step === 4 && !booked && (
        <div>
          <button
            onClick={() => setStep(3)}
            className="mb-4 flex items-center gap-1 text-sm text-foreground/50"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Zurueck
          </button>

          <h2 className="mb-6 font-serif text-xl font-semibold">
            Zusammenfassung
          </h2>

          <div className="mb-6 space-y-4 rounded-2xl border border-border bg-white p-5">
            <div className="flex justify-between">
              <span className="text-sm text-foreground/50">Kundin</span>
              <span className="text-sm font-medium">
                {selected.customer?.first_name} {selected.customer?.last_name}
              </span>
            </div>
            <div className="border-t border-border" />
            <div className="flex justify-between">
              <span className="text-sm text-foreground/50">Behandlung</span>
              <span className="text-sm font-medium">
                {selected.treatment?.name}
              </span>
            </div>
            <div className="border-t border-border" />
            <div className="flex justify-between">
              <span className="text-sm text-foreground/50">Datum</span>
              <span className="text-sm font-medium">
                {selected.date &&
                  new Date(selected.date).toLocaleDateString("de-DE", {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
              </span>
            </div>
            <div className="border-t border-border" />
            <div className="flex justify-between">
              <span className="text-sm text-foreground/50">Uhrzeit</span>
              <span className="text-sm font-medium">{selected.time} Uhr</span>
            </div>
            <div className="border-t border-border" />
            <div className="flex justify-between">
              <span className="text-sm text-foreground/50">Dauer</span>
              <span className="text-sm font-medium">
                {selected.treatment?.duration_minutes} Min.
              </span>
            </div>
            <div className="border-t border-border" />
            <div className="flex justify-between">
              <span className="text-sm text-foreground/50">Preis</span>
              <span className="text-base font-semibold text-primary">
                {selected.treatment?.price_eur} EUR
              </span>
            </div>
          </div>

          <button
            onClick={handleBook}
            disabled={booking}
            className="w-full rounded-xl bg-primary py-4 text-base font-semibold text-white transition-colors hover:bg-primary-hover active:bg-accent disabled:opacity-50"
            style={{ minHeight: 56 }}
          >
            {booking ? "Wird gebucht..." : "Termin buchen"}
          </button>
        </div>
      )}

      {/* Success screen */}
      {booked && (
        <div className="flex flex-col items-center py-12">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <h2 className="mb-2 font-serif text-xl font-semibold">
            Termin gebucht
          </h2>
          <p className="mb-8 text-center text-sm text-foreground/50">
            {selected.customer?.first_name} {selected.customer?.last_name}
            <br />
            {selected.treatment?.name} am{" "}
            {selected.date &&
              new Date(selected.date).toLocaleDateString("de-DE")}
            {" "}um {selected.time} Uhr
          </p>
          <button
            onClick={resetWizard}
            className="rounded-xl bg-primary px-8 py-3 text-base font-medium text-white transition-colors hover:bg-primary-hover active:bg-accent"
            style={{ minHeight: 56 }}
          >
            Neuer Termin
          </button>
        </div>
      )}
    </div>
  );
};

"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Appointment } from "@/lib/types";

const statusConfig: Record<string, { label: string; className: string }> = {
  confirmed: { label: "Bestaetigt", className: "bg-primary/10 text-primary border-primary/20" },
  completed: { label: "Abgeschlossen", className: "bg-success/10 text-success border-success/20" },
  cancelled: { label: "Abgesagt", className: "bg-danger/10 text-danger border-danger/20" },
  no_show: { label: "Nicht erschienen", className: "bg-foreground/10 text-foreground/50 border-foreground/10" },
};

const locationLabels: Record<string, string> = {
  neumarkt: "Neumarkt i.d.OPf.",
  kw: "KW Salon",
};

export default function PortalTerminePage() {
  const [upcoming, setUpcoming] = useState<Appointment[]>([]);
  const [past, setPast] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPast, setShowPast] = useState(false);
  const [noCustomer, setNoCustomer] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      const supabase = getSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Find customer linked to this auth user
      const { data: customer } = await supabase
        .schema("crm")
        .from("customers")
        .select("id")
        .eq("email", user.email)
        .maybeSingle();

      if (!customer) {
        setNoCustomer(true);
        setLoading(false);
        return;
      }

      // Fetch appointments
      const { data: appointments } = await supabase
        .schema("crm")
        .from("appointments")
        .select("*, treatment:treatments(*)")
        .eq("customer_id", customer.id)
        .order("date", { ascending: false });

      if (!appointments) {
        setLoading(false);
        return;
      }

      const today = new Date().toISOString().split("T")[0];
      const upcomingList: Appointment[] = [];
      const pastList: Appointment[] = [];

      for (const apt of appointments) {
        if (apt.date >= today && apt.status !== "cancelled") {
          upcomingList.push(apt as Appointment);
        } else {
          pastList.push(apt as Appointment);
        }
      }

      // Sort upcoming ascending (nearest first)
      upcomingList.sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time));

      setUpcoming(upcomingList);
      setPast(pastList);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Termine konnten nicht geladen werden. Bitte versuchen Sie es erneut.'
      );
    }
    setLoading(false);
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("de-DE", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  const formatTime = (time: string) => time.slice(0, 5);

  if (loading) {
    return (
      <div>
        <h1 className="mb-6 font-serif text-2xl font-semibold">Meine Termine</h1>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="mb-6 font-serif text-2xl font-semibold">Meine Termine</h1>
        <div className="rounded-2xl border border-danger/30 bg-danger/5 p-6 text-center">
          <p className="text-sm text-danger">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              loadAppointments();
            }}
            className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  if (noCustomer) {
    return (
      <div>
        <h1 className="mb-6 font-serif text-2xl font-semibold">Meine Termine</h1>
        <div className="rounded-2xl border border-border bg-white p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-foreground/30">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          </div>
          <p className="text-sm text-foreground/50">
            Noch keine Termine gefunden.
          </p>
          <p className="mt-1 text-xs text-foreground/30">
            Ihre Termine werden hier angezeigt, sobald Sie einen Termin bei uns haben.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl font-semibold">Meine Termine</h1>

      {/* Upcoming */}
      {upcoming.length > 0 ? (
        <div className="mb-8 space-y-3">
          {upcoming.map((apt) => {
            const status = statusConfig[apt.status];
            return (
              <div
                key={apt.id}
                className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm"
              >
                <div className="border-l-4 border-primary p-5">
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <p className="text-base font-semibold text-foreground">
                        {apt.treatment?.name || "Termin"}
                      </p>
                      <p className="mt-0.5 text-sm text-foreground/50">
                        {locationLabels[apt.location] || apt.location}
                      </p>
                    </div>
                    {status && (
                      <span
                        className={cn(
                          "rounded-full border px-2.5 py-0.5 text-xs font-medium",
                          status.className
                        )}
                      >
                        {status.label}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-foreground/70">
                    <span className="flex items-center gap-1.5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <path d="M16 2v4M8 2v4M3 10h18" />
                      </svg>
                      {formatDate(apt.date)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 6v6l4 2" />
                      </svg>
                      {formatTime(apt.start_time)} Uhr
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mb-8 rounded-2xl border border-border bg-white p-6 text-center">
          <p className="text-sm text-foreground/50">Keine anstehenden Termine</p>
        </div>
      )}

      {/* Past toggle */}
      {past.length > 0 && (
        <div>
          <button
            onClick={() => setShowPast(!showPast)}
            className="mb-3 flex w-full items-center justify-between rounded-xl bg-muted px-4 py-3 text-sm font-medium text-foreground/60 transition-colors hover:text-foreground"
          >
            <span>Vergangene Termine ({past.length})</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={cn("transition-transform", showPast && "rotate-180")}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          {showPast && (
            <div className="space-y-2">
              {past.map((apt) => {
                const status = statusConfig[apt.status];
                return (
                  <div
                    key={apt.id}
                    className="rounded-xl border border-border/60 bg-white/60 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground/70">
                          {apt.treatment?.name || "Termin"}
                        </p>
                        <p className="text-xs text-foreground/40">
                          {formatDate(apt.date)} um {formatTime(apt.start_time)} Uhr
                        </p>
                      </div>
                      {status && (
                        <span
                          className={cn(
                            "rounded-full border px-2 py-0.5 text-xs",
                            status.className
                          )}
                        >
                          {status.label}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

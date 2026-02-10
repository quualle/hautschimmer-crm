"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAppointments } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Appointment } from "@/lib/types";

function formatDateDE(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}

function formatTime(time: string): string {
  return time.slice(0, 5);
}

const statusColors: Record<string, string> = {
  confirmed: "bg-primary/10 text-primary",
  completed: "bg-success/10 text-success",
  cancelled: "bg-danger/10 text-danger",
  no_show: "bg-foreground/10 text-foreground/50",
};

const statusLabels: Record<string, string> = {
  confirmed: "Bestaetigt",
  completed: "Erledigt",
  cancelled: "Abgesagt",
  no_show: "Nicht erschienen",
};

export default function SalonKalenderPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [tomorrowAppointments, setTomorrowAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const pin = sessionStorage.getItem("salon_token");
    if (!pin) {
      router.replace("/salon");
      return;
    }
    setAuthorized(true);

    const location = sessionStorage.getItem("salon_location") || undefined;
    const today = new Date().toISOString().split("T")[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

    Promise.all([
      getAppointments({ date: today, location }),
      getAppointments({ date: tomorrow, location }),
    ])
      .then(([tData, tmData]) => {
        setTodayAppointments(tData);
        setTomorrowAppointments(tmData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  if (!authorized) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-foreground/40">Laden...</p>
      </div>
    );
  }

  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  const renderAppointments = (appointments: Appointment[], label: string) => (
    <div className="mb-8">
      <h2 className="mb-3 text-lg font-semibold text-foreground">{label}</h2>
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl bg-muted"
            />
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <div className="rounded-xl border border-border bg-white p-6 text-center">
          <p className="text-sm text-foreground/40">Keine Termine</p>
        </div>
      ) : (
        <div className="space-y-2">
          {appointments.map((apt) => (
            <div
              key={apt.id}
              className="flex items-center gap-4 rounded-xl border border-border bg-white p-4"
              style={{ minHeight: 56 }}
            >
              <div className="min-w-[60px] text-center">
                <p className="text-lg font-semibold text-foreground">
                  {formatTime(apt.start_time)}
                </p>
                <p className="text-xs text-foreground/40">
                  {formatTime(apt.end_time)}
                </p>
              </div>
              <div className="h-10 w-px bg-border" />
              <div className="flex-1">
                <p className="text-base font-medium text-foreground">
                  {apt.customer
                    ? `${apt.customer.first_name} ${apt.customer.last_name}`
                    : "Unbekannt"}
                </p>
                <p className="text-sm text-foreground/50">
                  {apt.treatment?.name || "Keine Behandlung"}
                </p>
              </div>
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-medium",
                  statusColors[apt.status] || "bg-muted text-foreground/50"
                )}
              >
                {statusLabels[apt.status] || apt.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl font-semibold">Tagesplan</h1>
      {renderAppointments(todayAppointments, `Heute, ${formatDateDE(today)}`)}
      {renderAppointments(tomorrowAppointments, `Morgen, ${formatDateDE(tomorrow)}`)}
    </div>
  );
}

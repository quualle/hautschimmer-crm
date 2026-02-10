"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonCard } from "@/components/ui/skeleton";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { getRevenueStats, getDailySchedule, getUpcomingBirthdays } from "@/lib/api";
import { TreatmentLogModal } from "@/app/dashboard/kunden/components/treatment-log-modal";
import type { RevenueStats, DailyScheduleItem, BirthdayEntry } from "@/lib/types";

// ========== Helpers ==========

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return "Guten Morgen";
  if (hour < 18) return "Guten Nachmittag";
  return "Guten Abend";
};

const formatDateHeader = (): string => {
  return new Date().toLocaleDateString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatTimeSlot = (time: string): string => {
  // time comes as "HH:MM:SS" or "HH:MM"
  return time.slice(0, 5);
};

const formatEur = (amount: number): string => {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const statusLabel: Record<string, string> = {
  confirmed: "Bestätigt",
  completed: "Abgeschlossen",
  cancelled: "Storniert",
  no_show: "Nicht erschienen",
};

const statusVariant = (
  status: string
): "success" | "default" | "danger" | "warning" => {
  switch (status) {
    case "completed":
      return "success";
    case "confirmed":
      return "default";
    case "cancelled":
      return "danger";
    case "no_show":
      return "warning";
    default:
      return "default";
  }
};

const statusBorderColor = (status: string): string => {
  switch (status) {
    case "confirmed":
      return "border-l-primary";
    case "completed":
      return "border-l-success";
    case "cancelled":
      return "border-l-danger";
    case "no_show":
      return "border-l-amber-500";
    default:
      return "border-l-border";
  }
};

const locationLabel = (loc: string): string => {
  return loc === "kw" ? "KW" : "Neumarkt";
};

// ========== Icons ==========

const CalendarIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);

const UsersIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const EuroIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M8 12h6M8 15h4M14.5 7.5a4 4 0 0 0-5 0M14.5 16.5a4 4 0 0 1-5 0" />
  </svg>
);

const ClipboardIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="8" y="2" width="8" height="4" rx="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <path d="M12 11h4M12 16h4M8 11h.01M8 16h.01" />
  </svg>
);

const UserPlusIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M19 8v6M22 11h-6" />
  </svg>
);

const PenIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 20h9" />
    <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838.838-2.872a2 2 0 0 1 .506-.854z" />
  </svg>
);

const MailIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const SunriseIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2 18h2M4.93 11.07l1.41 1.41M12 2v4M18.66 12.48l1.41-1.41M20 18h2M12 18a6 6 0 0 0-6-6 6 6 0 0 0 12 0" />
    <path d="M2 22h20" />
  </svg>
);

const CakeIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8" />
    <path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1" />
    <path d="M2 21h20" />
    <path d="M7 8v3M12 8v3M17 8v3" />
    <path d="M7 4h.01M12 4h.01M17 4h.01" />
  </svg>
);

// ========== Dashboard Page ==========

export default function DashboardPage() {
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [schedule, setSchedule] = useState<DailyScheduleItem[] | null>(null);
  const [birthdays, setBirthdays] = useState<BirthdayEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scheduleTab, setScheduleTab] = useState<"today" | "tomorrow">("today");

  // Treatment log modal state
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<DailyScheduleItem | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsData, scheduleData, birthdayData] = await Promise.all([
          getRevenueStats(),
          getDailySchedule(),
          getUpcomingBirthdays(),
        ]);
        setStats(statsData);
        setSchedule(scheduleData);
        setBirthdays(birthdayData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Fehler beim Laden der Daten"
        );
      }
    };
    load();
  }, []);

  // Load schedule when tab switches (skip initial "today" since useEffect above handles it)
  const handleTabSwitch = (tab: "today" | "tomorrow") => {
    if (tab === scheduleTab) return;
    setScheduleTab(tab);
    setSchedule(null);
    if (tab === "tomorrow") {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split("T")[0];
      getDailySchedule(dateStr)
        .then(setSchedule)
        .catch(() => setSchedule([]));
    } else {
      getDailySchedule()
        .then(setSchedule)
        .catch(() => setSchedule([]));
    }
  };

  const confirmedCount =
    schedule?.filter((s) => s.status === "confirmed").length ?? 0;

  const formatBirthday = (dob: string): string => {
    const d = new Date(dob);
    const birthday = new Date(new Date().getFullYear(), d.getMonth(), d.getDate());
    return birthday.toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "short" });
  };

  const getAge = (dob: string): number => {
    const d = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - d.getFullYear();
    const birthday = new Date(today.getFullYear(), d.getMonth(), d.getDate());
    if (birthday > today) age--;
    return age + 1; // upcoming age
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-semibold text-foreground">
          {getGreeting()}, Saskia
        </h1>
        <p className="mt-1 text-sm text-foreground/50">{formatDateHeader()}</p>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-danger/30 bg-danger/5 text-danger text-sm">
          {error}
        </Card>
      )}

      {/* Stat Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats ? (
          <>
            <StatCard
              title="Termine heute"
              value={stats.appointments_today}
              subtitle={`${confirmedCount} bestätigt`}
              icon={<CalendarIcon />}
            />
            <StatCard
              title="Kunden gesamt"
              value={stats.total_customers}
              subtitle={`${stats.new_customers_month} neu diesen Monat`}
              icon={<UsersIcon />}
            />
            <StatCard
              title="Umsatz Monat"
              value={formatEur(stats.month_revenue)}
              subtitle="aktueller Monat"
              icon={<EuroIcon />}
            />
            <StatCard
              title="Termine diese Woche"
              value={stats.appointments_week}
              subtitle="geplant"
              icon={<ClipboardIcon />}
            />
          </>
        ) : (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        )}
      </div>

      {/* Main Content: Schedule + Quick Actions + Birthdays */}
      <div className="grid gap-8 lg:grid-cols-5">
        {/* Schedule - 60% */}
        <div className="lg:col-span-3">
          {/* Heute / Morgen Toggle */}
          <div className="mb-4 flex items-center gap-1">
            <button
              onClick={() => handleTabSwitch("today")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                scheduleTab === "today"
                  ? "bg-primary/10 text-primary"
                  : "text-foreground/50 hover:bg-muted hover:text-foreground/80"
              }`}
            >
              Heute
            </button>
            <button
              onClick={() => handleTabSwitch("tomorrow")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                scheduleTab === "tomorrow"
                  ? "bg-primary/10 text-primary"
                  : "text-foreground/50 hover:bg-muted hover:text-foreground/80"
              }`}
            >
              Morgen
            </button>
          </div>

          {schedule === null ? (
            <div className="space-y-3">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : schedule.length === 0 ? (
            <Card>
              <EmptyState
                icon={<SunriseIcon />}
                title={scheduleTab === "today" ? "Keine Termine heute" : "Keine Termine morgen"}
                description={scheduleTab === "today" ? "Genieße den freien Tag oder plane neue Termine." : "Morgen ist noch nichts geplant."}
              />
            </Card>
          ) : (
            <div className="space-y-3">
              {schedule.map((item) => (
                <Card
                  key={item.appointment_id}
                  padding="sm"
                  className={`border-l-4 ${statusBorderColor(item.status)}`}
                >
                  <div className="flex items-center gap-4">
                    <Avatar name={item.customer_name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/kunden/${item.customer_id}`}
                          className="truncate text-sm font-medium text-foreground hover:text-primary"
                        >
                          {item.customer_name}
                        </Link>
                        <Badge variant={statusVariant(item.status)}>
                          {statusLabel[item.status] || item.status}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-foreground/50">
                        {item.treatment_name}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-medium text-foreground">
                        {formatTimeSlot(item.start_time)} –{" "}
                        {formatTimeSlot(item.end_time)}
                      </p>
                      <p className="text-xs text-foreground/40">
                        {locationLabel(item.location)} ·{" "}
                        {item.duration_minutes} Min
                      </p>
                    </div>
                    {/* Quick-Note Dropdown */}
                    <DropdownMenu
                      trigger={
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground/40 transition-colors hover:bg-muted hover:text-foreground">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="12" cy="5" r="2" />
                            <circle cx="12" cy="12" r="2" />
                            <circle cx="12" cy="19" r="2" />
                          </svg>
                        </span>
                      }
                      items={[
                        {
                          label: "Behandlung loggen",
                          icon: <PenIcon />,
                          onClick: () => {
                            setSelectedAppointment(item);
                            setShowLogModal(true);
                          },
                        },
                        {
                          label: "Kundenakte",
                          icon: <UsersIcon />,
                          onClick: () => {
                            window.location.href = `/dashboard/kunden/${item.customer_id}`;
                          },
                        },
                      ]}
                    />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Quick Actions + Birthdays */}
        <div className="lg:col-span-2 space-y-8">
          {/* Quick Actions */}
          <div>
            <h2 className="mb-4 font-serif text-lg font-semibold text-foreground">
              Schnellzugriff
            </h2>
            <div className="space-y-3">
              <Link href="/dashboard/kunden?action=new">
                <Card className="group cursor-pointer transition-colors hover:border-primary/40 hover:bg-primary/5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <UserPlusIcon />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground group-hover:text-primary">
                        Neue Kundin anlegen
                      </p>
                      <p className="text-xs text-foreground/40">
                        Kundenkartei erstellen
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
              <Link href="/dashboard/kunden">
                <Card className="group cursor-pointer transition-colors hover:border-primary/40 hover:bg-primary/5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <PenIcon />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground group-hover:text-primary">
                        Behandlung loggen
                      </p>
                      <p className="text-xs text-foreground/40">
                        Kundin suchen & dokumentieren
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
              <Link href="/dashboard/kampagnen?action=new">
                <Card className="group cursor-pointer transition-colors hover:border-primary/40 hover:bg-primary/5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <MailIcon />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground group-hover:text-primary">
                        Kampagne erstellen
                      </p>
                      <p className="text-xs text-foreground/40">
                        E-Mail an Kundinnen senden
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            </div>
          </div>

          {/* Birthday Widget */}
          <div>
            <h2 className="mb-4 font-serif text-lg font-semibold text-foreground">
              Geburtstage diese Woche
            </h2>
            {birthdays === null ? (
              <SkeletonCard />
            ) : birthdays.length === 0 ? (
              <Card>
                <EmptyState
                  icon={<CakeIcon />}
                  title="Keine Geburtstage diese Woche"
                  description=""
                />
              </Card>
            ) : (
              <Card padding="sm">
                <div className="space-y-3">
                  {birthdays.map((b) => (
                    <div key={b.id} className="flex items-center gap-3">
                      <Avatar name={`${b.first_name} ${b.last_name}`} size="sm" />
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/dashboard/kunden/${b.id}`}
                          className="truncate text-sm font-medium text-foreground hover:text-primary"
                        >
                          {b.first_name} {b.last_name}
                        </Link>
                        <p className="text-xs text-foreground/50">
                          {formatBirthday(b.date_of_birth)} &middot; wird {getAge(b.date_of_birth)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Treatment Log Modal */}
      {selectedAppointment && (
        <TreatmentLogModal
          open={showLogModal}
          onClose={() => {
            setShowLogModal(false);
            setSelectedAppointment(null);
          }}
          customerId={selectedAppointment.customer_id}
          customerName={selectedAppointment.customer_name}
        />
      )}
    </div>
  );
}

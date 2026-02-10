"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface InfoSection {
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

const sections: InfoSection[] = [
  {
    title: "Kontakt",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    ),
    content: (
      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-foreground/50">Telefon</span>
          <a href="tel:+4991813359944" className="font-medium text-primary">
            09181 335 99 44
          </a>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-foreground/50">E-Mail</span>
          <a href="mailto:info@hautschimmer.de" className="font-medium text-primary">
            info@hautschimmer.de
          </a>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-foreground/50">Website</span>
          <a href="https://hautschimmer.de" target="_blank" rel="noopener noreferrer" className="font-medium text-primary">
            hautschimmer.de
          </a>
        </div>
      </div>
    ),
  },
  {
    title: "Standorte",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
    content: (
      <div className="space-y-4 text-sm">
        <div>
          <p className="font-medium text-foreground">Neumarkt i.d.OPf.</p>
          <p className="mt-0.5 text-foreground/50">
            Hautschimmer - Aesthetische Medizin
          </p>
          <p className="text-foreground/50">
            Neumarkt i.d.OPf.
          </p>
        </div>
        <div className="border-t border-border pt-4">
          <p className="font-medium text-foreground">KW Salon</p>
          <p className="mt-0.5 text-foreground/50">
            Beauty for Princess - Kosmetikstudio
          </p>
        </div>
      </div>
    ),
  },
  {
    title: "Oeffnungszeiten",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
    content: (
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-foreground/50">Montag - Freitag</span>
          <span className="font-medium text-foreground">09:00 - 18:00</span>
        </div>
        <div className="flex justify-between">
          <span className="text-foreground/50">Samstag</span>
          <span className="font-medium text-foreground">Nach Vereinbarung</span>
        </div>
        <div className="flex justify-between">
          <span className="text-foreground/50">Sonntag</span>
          <span className="text-foreground/40">Geschlossen</span>
        </div>
        <p className="mt-2 text-xs text-foreground/40">
          Termine ausserhalb der Oeffnungszeiten nach Absprache moeglich.
        </p>
      </div>
    ),
  },
  {
    title: "Nachsorge-Tipps",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </svg>
    ),
    content: (
      <div className="space-y-4 text-sm">
        <div>
          <p className="mb-1 font-medium text-foreground">
            Nach Botox-Behandlung
          </p>
          <ul className="space-y-1 text-foreground/60">
            <li>- 4 Stunden aufrecht bleiben, nicht hinlegen</li>
            <li>- 24 Stunden kein Sport oder Sauna</li>
            <li>- Behandelte Stellen nicht massieren</li>
            <li>- Ergebnis zeigt sich nach 3-14 Tagen</li>
          </ul>
        </div>
        <div className="border-t border-border pt-3">
          <p className="mb-1 font-medium text-foreground">
            Nach Hyaluron-Behandlung
          </p>
          <ul className="space-y-1 text-foreground/60">
            <li>- Schwellungen sind normal (1-3 Tage)</li>
            <li>- 24-48 Stunden kein Make-up auf behandelte Stellen</li>
            <li>- 2 Wochen keinen starken Druck ausueben</li>
            <li>- Bei starken Schmerzen bitte melden</li>
          </ul>
        </div>
        <div className="border-t border-border pt-3">
          <p className="mb-1 font-medium text-foreground">
            Allgemeine Tipps
          </p>
          <ul className="space-y-1 text-foreground/60">
            <li>- Ausreichend Wasser trinken</li>
            <li>- Sonnenschutz verwenden (LSF 30+)</li>
            <li>- Alkohol in den ersten 24h vermeiden</li>
            <li>- Bei Fragen oder Komplikationen sofort melden</li>
          </ul>
        </div>
      </div>
    ),
  },
];

export default function PortalInfoPage() {
  const [openSection, setOpenSection] = useState<number | null>(null);

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl font-semibold">Informationen</h1>

      <div className="space-y-3">
        {sections.map((section, i) => {
          const isOpen = openSection === i;
          return (
            <div
              key={section.title}
              className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm"
            >
              <button
                onClick={() => setOpenSection(isOpen ? null : i)}
                className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-muted/50"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {section.icon}
                </div>
                <span className="flex-1 text-base font-medium text-foreground">
                  {section.title}
                </span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={cn(
                    "text-foreground/30 transition-transform",
                    isOpen && "rotate-180"
                  )}
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              {isOpen && (
                <div className="border-t border-border px-4 pb-4 pt-3">
                  {section.content}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

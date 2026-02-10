"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function PortalLoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/portal/termine`,
      },
    });

    if (authError) {
      setError("Fehler beim Senden des Login-Links. Bitte versuchen Sie es erneut.");
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-10 text-center">
          <h1 className="font-serif text-4xl font-semibold text-foreground">
            Hautschimmer
          </h1>
          <p className="mt-2 text-sm tracking-wide text-foreground/40">
            Mein Bereich
          </p>
        </div>

        {!sent ? (
          <div className="rounded-2xl border border-border bg-white p-8 shadow-sm">
            <form onSubmit={handleLogin} className="flex flex-col gap-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-foreground/40"
                >
                  E-Mail-Adresse
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="ihre@email.de"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-xl border border-border bg-muted px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
              >
                {loading ? "Wird gesendet..." : "Magic Link senden"}
              </button>
            </form>

            {error && (
              <p className="mt-4 text-center text-sm text-danger">{error}</p>
            )}

            <p className="mt-5 text-center text-xs leading-relaxed text-foreground/40">
              Sie erhalten einen Login-Link per E-Mail.
              <br />
              Kein Passwort noetig.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#16A34A"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </div>
            <h2 className="mb-2 font-serif text-lg font-semibold text-foreground">
              E-Mail gesendet
            </h2>
            <p className="mb-4 text-sm text-foreground/60">
              Wir haben einen Login-Link an{" "}
              <span className="font-medium text-foreground">{email}</span>{" "}
              gesendet.
            </p>
            <p className="text-xs text-foreground/40">
              Bitte pruefen Sie Ihren Posteingang und klicken Sie auf den Link.
            </p>
            <button
              onClick={() => {
                setSent(false);
                setEmail("");
              }}
              className="mt-6 text-sm text-primary transition-colors hover:text-accent"
            >
              Andere E-Mail verwenden
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";

export default function SalonPinPage() {
  const [pin, setPin] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // PIN verification will be implemented
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-xs text-center">
        <h1 className="mb-6 font-serif text-2xl font-semibold">Salon-Modus</h1>
        <p className="mb-4 text-sm text-foreground/60">
          Bitte PIN eingeben
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            placeholder="****"
            className="rounded-lg border border-border bg-white px-4 py-3 text-center text-2xl tracking-widest outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={pin.length !== 4}
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            Entsperren
          </button>
        </form>
      </div>
    </div>
  );
}

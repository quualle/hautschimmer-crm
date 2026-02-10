"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { getSupabaseClient } from "@/lib/api";

const PIN_LENGTH = 4;
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

export default function SalonPinPage() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleKey = useCallback(
    (key: string) => {
      if (loading) return;
      setError("");

      if (key === "del") {
        setPin((prev) => prev.slice(0, -1));
        return;
      }

      if (pin.length >= PIN_LENGTH) return;

      const newPin = pin + key;
      setPin(newPin);

      if (newPin.length === PIN_LENGTH) {
        verifyPin(newPin);
      }
    },
    [pin, loading]
  );

  const verifyPin = async (entered: string) => {
    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      const { data, error: dbError } = await supabase
        .schema("crm")
        .from("salon_access")
        .select("id, name, location")
        .eq("pin_hash", entered)
        .eq("active", true)
        .maybeSingle();

      if (dbError || !data) {
        setError("Ungueltiger PIN");
        setShake(true);
        setTimeout(() => {
          setShake(false);
          setPin("");
        }, 600);
        setLoading(false);
        return;
      }

      sessionStorage.setItem("salon_pin", entered);
      sessionStorage.setItem("salon_name", data.name);
      sessionStorage.setItem("salon_location", data.location);
      router.push("/salon/buchen");
    } catch {
      setError("Verbindungsfehler");
      setPin("");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-xs">
        {/* Logo */}
        <h1 className="mb-1 text-center font-serif text-3xl font-semibold text-foreground">
          Hautschimmer
        </h1>
        <p className="mb-10 text-center text-sm text-foreground/50">
          Salon-Modus
        </p>

        {/* PIN Dots */}
        <div
          className={cn(
            "mb-8 flex items-center justify-center gap-4",
            shake && "animate-shake"
          )}
        >
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-4 w-4 rounded-full border-2 transition-all duration-150",
                i < pin.length
                  ? "border-primary bg-primary"
                  : "border-border bg-transparent"
              )}
            />
          ))}
        </div>

        {/* Error */}
        {error && (
          <p className="mb-4 text-center text-sm font-medium text-danger">
            {error}
          </p>
        )}

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-3">
          {KEYS.map((key, i) => {
            if (key === "") {
              return <div key={i} />;
            }

            if (key === "del") {
              return (
                <button
                  key={i}
                  onClick={() => handleKey("del")}
                  disabled={loading}
                  className="flex h-16 items-center justify-center rounded-xl bg-muted text-foreground/60 transition-colors active:bg-border disabled:opacity-50"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                    <path d="m18 9-6 6M12 9l6 6" />
                  </svg>
                </button>
              );
            }

            return (
              <button
                key={i}
                onClick={() => handleKey(key)}
                disabled={loading}
                className="flex h-16 items-center justify-center rounded-xl bg-white text-xl font-medium text-foreground shadow-sm transition-colors active:bg-muted disabled:opacity-50"
              >
                {key}
              </button>
            );
          })}
        </div>
      </div>

      {/* Shake animation style */}
      <style jsx>{`
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          10%,
          30%,
          50%,
          70%,
          90% {
            transform: translateX(-6px);
          }
          20%,
          40%,
          60%,
          80% {
            transform: translateX(6px);
          }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookingWizard } from "./components/booking-wizard";

export default function SalonBuchenPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const pin = sessionStorage.getItem("salon_token");
    if (!pin) {
      router.replace("/salon");
    } else {
      setAuthorized(true);
    }
  }, [router]);

  if (!authorized) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-foreground/40">Laden...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl font-semibold">Termin buchen</h1>
      <BookingWizard />
    </div>
  );
}

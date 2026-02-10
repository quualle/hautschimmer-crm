"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SalonNav } from "@/components/layout/salon-nav";
import { ToastContainer } from "@/components/ui/toast";

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

function useSalonTimeout() {
  const router = useRouter();
  const pathname = usePathname();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isLoginPage = pathname === "/salon";

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      sessionStorage.clear();
      router.push("/salon");
    }, INACTIVITY_TIMEOUT_MS);
  }, [router]);

  useEffect(() => {
    if (isLoginPage) return;

    const events = ["mousedown", "touchstart", "keydown", "scroll"];
    const handler = () => resetTimer();

    events.forEach((e) => window.addEventListener(e, handler));
    resetTimer();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((e) => window.removeEventListener(e, handler));
    };
  }, [isLoginPage, resetTimer]);
}

export default function SalonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/salon";

  useSalonTimeout();

  if (isLoginPage) {
    return (
      <>
        {children}
        <ToastContainer />
      </>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1 p-4 pb-20">{children}</main>
      <SalonNav />
      <ToastContainer />
    </div>
  );
}

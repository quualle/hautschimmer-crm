"use client";

import { usePathname } from "next/navigation";
import { SalonNav } from "@/components/layout/salon-nav";
import { ToastContainer } from "@/components/ui/toast";

export default function SalonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/salon";

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

"use client";

import { usePathname } from "next/navigation";
import { PortalNav } from "@/components/layout/portal-nav";
import { ToastContainer } from "@/components/ui/toast";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/portal";

  if (isLoginPage) {
    return (
      <>
        {children}
        <ToastContainer />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PortalNav />
      <main className="mx-auto max-w-2xl p-4 pt-6">{children}</main>
      <ToastContainer />
    </div>
  );
}

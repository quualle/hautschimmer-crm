import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Heute", icon: "📅" },
  { href: "/dashboard/kalender", label: "Kalender", icon: "🗓" },
  { href: "/dashboard/kunden", label: "Kunden", icon: "👤" },
  { href: "/dashboard/kampagnen", label: "Kampagnen", icon: "📧" },
  { href: "/dashboard/einstellungen", label: "Einstellungen", icon: "⚙" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 flex-col border-r border-border bg-white">
        <div className="border-b border-border px-6 py-5">
          <h2 className="font-serif text-lg font-semibold text-foreground">
            Hautschimmer
          </h2>
          <p className="text-xs text-foreground/50">CRM</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 bg-background p-6">{children}</main>
    </div>
  );
}

import Link from "next/link";

const tabItems = [
  { href: "/salon/buchen", label: "Buchen" },
  { href: "/salon/kalender", label: "Kalender" },
];

export default function SalonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1 p-4">{children}</main>
      <nav className="flex border-t border-border bg-white">
        {tabItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-1 items-center justify-center py-3 text-sm font-medium text-foreground/60 transition-colors hover:text-primary"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

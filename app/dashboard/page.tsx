export default function DashboardPage() {
  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl font-semibold">Tagesansicht</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-white p-5">
          <p className="text-sm text-foreground/50">Termine heute</p>
          <p className="mt-1 text-2xl font-semibold">--</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-5">
          <p className="text-sm text-foreground/50">Neue Anfragen</p>
          <p className="mt-1 text-2xl font-semibold">--</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-5">
          <p className="text-sm text-foreground/50">Umsatz heute</p>
          <p className="mt-1 text-2xl font-semibold">--</p>
        </div>
      </div>
    </div>
  );
}

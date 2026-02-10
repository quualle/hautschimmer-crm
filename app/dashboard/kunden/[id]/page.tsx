export default async function KundenDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl font-semibold">
        Kundenprofil
      </h1>
      <p className="text-foreground/60">Kunden-ID: {id}</p>
    </div>
  );
}

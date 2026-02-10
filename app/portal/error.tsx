'use client';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center">
      <h2 className="font-serif text-xl text-foreground">Etwas ist schiefgelaufen</h2>
      <p className="mt-2 text-sm text-foreground/50">{error.message}</p>
      <button
        onClick={reset}
        className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm text-white hover:bg-primary/90"
      >
        Erneut versuchen
      </button>
    </div>
  );
}

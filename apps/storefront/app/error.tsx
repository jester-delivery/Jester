"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#050610] via-[#040411] to-[#050610] flex flex-col items-center justify-center text-white px-4">
      <h1 className="text-xl font-semibold text-amber-400">Ceva nu a mers bine</h1>
      <p className="mt-2 text-white/70 text-center text-sm max-w-md">
        A apărut o eroare neașteptată. Poți încerca din nou sau merge la pagina principală.
      </p>
      <div className="mt-6 flex gap-4">
        <button
          type="button"
          onClick={reset}
          className="rounded-xl bg-amber-500/90 px-4 py-2.5 font-medium text-black hover:bg-amber-500"
        >
          Încearcă din nou
        </button>
        <Link
          href="/"
          className="rounded-xl border border-white/30 px-4 py-2.5 font-medium text-white/90 hover:bg-white/10"
        >
          Mergi la prima pagină
        </Link>
      </div>
    </main>
  );
}

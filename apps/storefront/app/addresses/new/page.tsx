"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import BottomNavigation from "@/components/ui/BottomNavigation";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { useAuthReady } from "@/hooks/useAuthReady";

function NewAddressContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromCheckout = searchParams.get("from") === "checkout";
  const authReady = useAuthReady();
  const { isAuthenticated, user } = useAuthStore();
  const [label, setLabel] = useState<"Home" | "Work" | "Other">("Home");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [details, setDetails] = useState("");
  const [city, setCity] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!street.trim() || !city.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await api.me.createAddress({
        label,
        street: street.trim(),
        number: number.trim() || undefined,
        details: details.trim() || undefined,
        city: city.trim(),
        isDefault,
      });
      router.push(fromCheckout ? "/jester-24-24/checkout" : "/addresses");
    } catch (err: any) {
      setError(err.response?.data?.error || "Eroare la creare adresă");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authReady) return;
    if (!isAuthenticated || !user) {
      const token = typeof window !== "undefined" ? localStorage.getItem("jester_token") : null;
      if (token) return;
      router.replace("/login?next=" + encodeURIComponent("/addresses/new"));
    }
  }, [authReady, isAuthenticated, user, router]);

  if (!authReady || (!isAuthenticated && typeof window !== "undefined" && localStorage.getItem("jester_token"))) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#050610] via-[#040411] to-[#050610] text-white">
        <p className="text-white/70">Se încarcă...</p>
      </main>
    );
  }
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#050610] via-[#040411] to-[#050610] pb-24 text-white">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link href="/addresses" className="text-sm text-white/70 underline hover:text-white">
          ← Înapoi la adrese
        </Link>
        <h1 className="mt-4 text-2xl font-bold">Adaugă adresă</h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-white/90">Etichetă</label>
            <select
              value={label}
              onChange={(e) => setLabel(e.target.value as "Home" | "Work" | "Other")}
              className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-white focus:border-amber-500/60 focus:outline-none"
            >
              <option value="Home">Acasă</option>
              <option value="Work">Serviciu</option>
              <option value="Other">Altele</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-white/90">Stradă *</label>
            <input
              type="text"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              placeholder="Ex: Str. Exemplu"
              className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-amber-500/60 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-white/90">Număr</label>
              <input
                type="text"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="nr."
                className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-amber-500/60 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-white/90">Oraș *</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ex: București"
                className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-amber-500/60 focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-white/90">Detalii (bloc, scara, apartament)</label>
            <input
              type="text"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="bl. X, sc. Y, ap. Z"
              className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-amber-500/60 focus:outline-none"
            />
          </div>

          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="h-4 w-4 accent-amber-500"
            />
            <span className="text-sm text-white/80">Setează ca adresă implicită</span>
          </label>

          {error && <p className="text-red-300 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-amber-500 py-4 font-semibold text-black hover:bg-amber-400 disabled:opacity-50"
          >
            {loading ? "Se salvează..." : "Salvează adresa"}
          </button>
        </form>
      </div>
      <BottomNavigation />
    </main>
  );
}

export default function NewAddressPage() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#050610] via-[#040411] to-[#050610] text-white">
        <p className="text-white/70">Se încarcă...</p>
      </main>
    }>
      <NewAddressContent />
    </Suspense>
  );
}

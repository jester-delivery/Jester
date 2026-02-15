"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import BottomNavigation from "@/components/ui/BottomNavigation";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

export default function EditAddressPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string | undefined;
  const { isAuthenticated, user } = useAuthStore();
  const [label, setLabel] = useState<"Home" | "Work" | "Other">("Home");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [details, setDetails] = useState("");
  const [city, setCity] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user || !id) return;
    api.me
      .getAddresses()
      .then((res) => {
        const addr = (res.data.addresses ?? []).find((a) => a.id === id);
        if (addr) {
          setLabel(addr.label as "Home" | "Work" | "Other");
          setStreet(addr.street);
          setNumber(addr.number || "");
          setDetails(addr.details || "");
          setCity(addr.city);
          setIsDefault(addr.isDefault);
        } else {
          setError("Adresă negăsită");
        }
      })
      .catch(() => setError("Eroare la încărcare"))
      .finally(() => setFetching(false));
  }, [isAuthenticated, user, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!street.trim() || !city.trim() || !id) return;
    setLoading(true);
    setError(null);
    try {
      await api.me.updateAddress(id, {
        label,
        street: street.trim(),
        number: number.trim() || undefined,
        details: details.trim() || undefined,
        city: city.trim(),
        isDefault,
      });
      router.push("/addresses");
    } catch (err: any) {
      setError(err.response?.data?.error || "Eroare la actualizare");
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || !user) {
    router.replace("/login?next=" + encodeURIComponent("/addresses/" + id + "/edit"));
    return null;
  }

  if (fetching) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#050610] via-[#040411] to-[#050610] text-white">
        <p className="text-white/70">Se încarcă...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#050610] via-[#040411] to-[#050610] pb-24 text-white">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link href="/addresses" className="text-sm text-white/70 underline hover:text-white">
          ← Înapoi la adrese
        </Link>
        <h1 className="mt-4 text-2xl font-bold">Editează adresă</h1>

        {error && <p className="mt-4 text-red-300">{error}</p>}

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
              required
              className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-amber-500/60 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-white/90">Număr</label>
              <input
                type="text"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-amber-500/60 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-white/90">Oraș *</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-amber-500/60 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-white/90">Detalii</label>
            <input
              type="text"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
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
            <span className="text-sm text-white/80">Adresă implicită</span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-amber-500 py-4 font-semibold text-black hover:bg-amber-400 disabled:opacity-50"
          >
            {loading ? "Se salvează..." : "Salvează modificările"}
          </button>
        </form>
      </div>
      <BottomNavigation />
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BottomNavigation from "@/components/ui/BottomNavigation";
import { api, type Address } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

const LABEL_MAP: Record<string, string> = {
  Home: "Acasă",
  Work: "Serviciu",
  Other: "Altele",
};

function formatAddress(addr: Address) {
  const parts = [addr.street];
  if (addr.number) parts.push(`nr. ${addr.number}`);
  if (addr.details) parts.push(addr.details);
  parts.push(addr.city);
  return parts.join(", ");
}

export default function AddressesPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAddresses = async () => {
    try {
      const res = await api.me.getAddresses();
      setAddresses(res.data.addresses ?? []);
      setError(null);
    } catch {
      setError("Nu s-au putut încărca adresele.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.replace("/login?next=" + encodeURIComponent("/addresses"));
      return;
    }
    fetchAddresses();
  }, [isAuthenticated, user, router]);

  const handleSetDefault = async (id: string) => {
    try {
      await api.me.updateAddress(id, { isDefault: true });
      await fetchAddresses();
    } catch {
      setError("Eroare la setarea adresei implicite.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Ștergi această adresă?")) return;
    try {
      await api.me.deleteAddress(id);
      await fetchAddresses();
    } catch {
      setError("Eroare la ștergerea adresei.");
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#050610] via-[#040411] to-[#050610] text-white">
        <p className="text-white/70">Se redirecționează la login...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#050610] via-[#040411] to-[#050610] pb-24 text-white">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link href="/profile" className="text-sm text-white/70 underline hover:text-white">
          ← Înapoi la profil
        </Link>
        <h1 className="mt-4 text-2xl font-bold">Adrese salvate</h1>
        <p className="mt-1 text-sm text-white/70">Gestionează adresele tale de livrare</p>

        {loading && <p className="mt-6 text-white/70">Se încarcă...</p>}
        {error && <p className="mt-6 text-red-300">{error}</p>}

        {!loading && !error && addresses.length === 0 && (
          <div className="mt-6 rounded-2xl border border-white/20 bg-white/5 p-6 text-center">
            <p className="text-white/70">Nu ai adrese salvate încă.</p>
            <Link
              href="/addresses/new"
              className="mt-4 inline-block rounded-xl bg-amber-500 px-4 py-2 font-semibold text-black hover:bg-amber-400"
            >
              Adaugă adresă
            </Link>
          </div>
        )}

        {!loading && !error && addresses.length > 0 && (
          <ul className="mt-6 space-y-4">
            {addresses.map((addr) => (
              <li
                key={addr.id}
                className={`rounded-2xl border p-4 ${
                  addr.isDefault ? "border-amber-500/60 bg-amber-500/10" : "border-white/20 bg-white/5"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-semibold text-amber-400/90 uppercase tracking-wide">
                      {LABEL_MAP[addr.label] ?? addr.label}
                      {addr.isDefault && " • Implicită"}
                    </span>
                    <p className="mt-1 text-white">{formatAddress(addr)}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {!addr.isDefault && (
                    <button
                      onClick={() => handleSetDefault(addr.id)}
                      className="rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/20"
                    >
                      Setează implicit
                    </button>
                  )}
                  <Link
                    href={`/addresses/${addr.id}/edit`}
                    className="rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/20"
                  >
                    Editează
                  </Link>
                  <button
                    onClick={() => handleDelete(addr.id)}
                    className="rounded-lg bg-red-500/20 px-3 py-1.5 text-sm font-medium text-red-300 hover:bg-red-500/30"
                  >
                    Șterge
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {!loading && addresses.length > 0 && (
          <Link
            href="/addresses/new"
            className="mt-6 block w-full rounded-xl border border-dashed border-white/30 py-4 text-center text-white/80 transition hover:border-amber-500/60 hover:text-amber-400"
          >
            + Adaugă adresă
          </Link>
        )}
      </div>
      <BottomNavigation />
    </main>
  );
}

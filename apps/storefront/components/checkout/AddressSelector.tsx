"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type Address } from "@/lib/api";

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

type Props = {
  selectedId: string | null;
  onSelect: (addr: Address) => void;
  open: boolean;
  onClose: () => void;
};

export default function AddressSelector({ selectedId, onSelect, open, onClose }: Props) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      setLoading(true);
      api.me
        .getAddresses()
        .then((res) => setAddresses(res.data.addresses ?? []))
        .catch(() => setAddresses([]))
        .finally(() => setLoading(false));
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90" role="dialog">
      <div className="flex items-center justify-between border-b border-white/20 p-4">
        <h2 className="text-lg font-bold text-white">Alege adresa</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-3 py-1 text-white/80 hover:bg-white/10"
        >
          Închide
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {loading && <p className="text-white/70">Se încarcă...</p>}
        {!loading && addresses.length === 0 && (
          <div className="rounded-2xl border border-white/20 bg-white/5 p-6 text-center">
            <p className="text-white/70">Nu ai adrese salvate.</p>
            <Link
              href="/addresses/new?from=checkout"
              className="mt-4 inline-block rounded-xl bg-amber-500 px-4 py-2 font-semibold text-black hover:bg-amber-400"
            >
              Adaugă adresă
            </Link>
          </div>
        )}
        {!loading && addresses.length > 0 && (
          <ul className="space-y-3">
            {addresses.map((addr) => (
              <li key={addr.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(addr);
                    onClose();
                  }}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    selectedId === addr.id
                      ? "border-amber-500 bg-amber-500/20"
                      : "border-white/20 bg-white/5 hover:border-white/30"
                  }`}
                >
                  <span className="text-xs font-semibold text-amber-400/90 uppercase">
                    {LABEL_MAP[addr.label] ?? addr.label}
                    {addr.isDefault && " • Implicită"}
                  </span>
                  <p className="mt-1 text-white">{formatAddress(addr)}</p>
                </button>
              </li>
            ))}
          </ul>
        )}
        <Link
          href="/addresses/new?from=checkout"
          className="mt-4 block w-full rounded-xl border border-dashed border-white/30 py-3 text-center text-sm text-white/80 hover:border-amber-500/60 hover:text-amber-400"
        >
          + Adaugă adresă nouă
        </Link>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useJester24CartStore } from "@/stores/jester24CartStore";
import { useAuthStore } from "@/stores/authStore";
import { api, type Address } from "@/lib/api";
import AddressSelector from "@/components/checkout/AddressSelector";

function formatAddressForOrder(addr: Address) {
  const parts = [addr.street];
  if (addr.number) parts.push(`nr. ${addr.number}`);
  if (addr.details) parts.push(addr.details);
  parts.push(addr.city);
  return parts.join(", ");
}

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const items = useJester24CartStore((s) => s.items);
  const getTotalPrice = useJester24CartStore((s) => s.getTotalPrice);
  const clearCart = useJester24CartStore((s) => s.clear);

  const [mounted, setMounted] = useState(false);
  const [address, setAddress] = useState("");
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showAddressInput, setShowAddressInput] = useState(false);
  const [showAddressSelector, setShowAddressSelector] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
    }
  }, [user]);

  useEffect(() => {
    if (!mounted || !isAuthenticated || !user) return;
    api.me
      .getAddresses()
      .then((res) => {
        const addrs = res.data.addresses ?? [];
        const defaultAddr = addrs.find((a) => a.isDefault) ?? addrs[0];
        if (defaultAddr) {
          setSelectedAddress(defaultAddr);
          setAddress(formatAddressForOrder(defaultAddr));
          setShowAddressInput(false);
        } else if (addrs.length > 0) {
          setSelectedAddress(addrs[0]);
          setAddress(formatAddressForOrder(addrs[0]));
          setShowAddressInput(false);
        } else {
          setShowAddressInput(true);
        }
      })
      .catch(() => setShowAddressInput(true));
  }, [mounted, isAuthenticated, user]);

  useEffect(() => {
    if (!mounted) return;
    if (!isAuthenticated || !user) {
      router.replace("/login?next=" + encodeURIComponent("/jester-24-24/checkout"));
    }
  }, [mounted, isAuthenticated, user, router]);

  useEffect(() => {
    if (mounted && items.length === 0) {
      router.replace("/jester-24-24");
    }
  }, [mounted, items.length, router]);

  const total = mounted ? getTotalPrice() : 0;

  const isValidROPhone = (ph: string) => {
    const digits = ph.replace(/\D/g, "");
    return (digits.length === 10 && /^07/.test(digits)) || (digits.length === 12 && /^40/.test(digits));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    const addr = address.trim();
    const ph = phone.trim();
    const nm = name.trim();
    if (!addr || addr.length < 5) e.address = "Adresa de livrare este obligatorie (min. 5 caractere)";
    if (!ph || ph.length < 8) e.phone = "Telefonul este obligatoriu (min. 8 caractere)";
    else if (!isValidROPhone(ph)) e.phone = "Telefon invalid. Formate acceptate: 07xx xxx xxx sau +40 7xx xxx xxx";
    if (!nm || nm.length < 2) e.name = "Numele clientului este obligatoriu (min. 2 caractere)";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || items.length === 0) return;

    setLoading(true);
    try {
      const payload = {
        total: Number(getTotalPrice()),
        items: items.map((i) => ({
          name: String(i.name),
          price: Number(i.price),
          quantity: Math.max(1, Math.floor(Number(i.qty) || 1)),
        })),
        deliveryAddress: address.trim(),
        phone: phone.trim(),
        name: name.trim(),
        notes: notes.trim() || undefined,
        paymentMethod: (paymentMethod === "cash" ? "CASH_ON_DELIVERY" : "CARD") as "CASH_ON_DELIVERY" | "CARD",
      };

      const res = await api.cartOrders.create(payload);
      const orderId = res.data?.orderId;

      clearCart();
      if (orderId) {
        router.push(`/orders/${orderId}?placed=1`);
      } else {
        router.push("/orders");
      }
    } catch {
      setErrors({ submit: "Eroare la plasarea comenzii. Încearcă din nou." });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAddress = (addr: Address) => {
    setSelectedAddress(addr);
    setAddress(formatAddressForOrder(addr));
    setShowAddressInput(false);
    setShowAddressSelector(false);
  };

  const hasSavedAddress = !showAddressInput && address.length >= 5;

  if (!mounted) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#050610] via-[#040411] to-[#050610] pb-24 text-white">
        <div className="mx-auto max-w-2xl px-4 py-12 text-center">
          <p className="text-white/70">Se încarcă...</p>
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#050610] via-[#040411] to-[#050610] pb-24 text-white">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link
          href="/jester-24-24"
          className="text-sm text-white/70 underline hover:text-white"
        >
          ← Înapoi la Jester 24/24
        </Link>
        <h1 className="mt-4 text-2xl font-bold">Checkout</h1>
        <p className="mt-1 text-white/70">
          {items.length} produs(e) · Total: {total.toFixed(2)} lei
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {/* Adresă livrare */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-white/90">
              Adresă livrare
            </label>
            {hasSavedAddress ? (
              <div className="rounded-xl border border-white/20 bg-white/5 p-4">
                <p className="text-white">Livrează la: {address}</p>
                <div className="mt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddressSelector(true)}
                    className="text-sm text-amber-400 underline"
                  >
                    Schimbă
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddressInput(true)}
                    className="text-sm text-white/60 underline"
                  >
                    Introdu manual
                  </button>
                </div>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Strada, număr, bloc, scara, apartament, oraș"
                  className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-amber-500/60 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
                  required
                  minLength={5}
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-400">{errors.address}</p>
                )}
              </>
            )}
          </div>

          {/* Nume client */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-white/90">
              Nume client
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Numele tău complet"
              className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-amber-500/60 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
              required
              minLength={2}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-400">{errors.name}</p>
            )}
          </div>

          {/* Telefon */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-white/90">
              Telefon
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="07xx xxx xxx"
              className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-amber-500/60 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
              required
              minLength={8}
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-400">{errors.phone}</p>
            )}
          </div>

          {/* Instrucțiuni livrare */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-white/90">
              Instrucțiuni livrare <span className="text-white/50">(opțional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Sonerie defectă, sună la ușă"
              rows={3}
              className="w-full resize-none rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-amber-500/60 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
            />
          </div>

          {/* Metodă plată */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-white/90">
              Modalitate plată
            </label>
            <div className="space-y-3">
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/20 bg-white/5 px-4 py-3 has-[:checked]:border-amber-500/60 has-[:checked]:bg-amber-500/10">
                <input
                  type="radio"
                  name="payment"
                  value="cash"
                  checked={paymentMethod === "cash"}
                  onChange={() => setPaymentMethod("cash")}
                  className="h-4 w-4 accent-amber-500"
                />
                <span className="text-white">Plată la livrare</span>
                <span className="text-xs text-white/60">• Disponibil</span>
              </label>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 opacity-70">
                <input
                  type="radio"
                  name="payment"
                  value="card"
                  checked={paymentMethod === "card"}
                  onChange={() => {}}
                  disabled
                  className="h-4 w-4"
                />
                <span className="text-white/70">Plată cu cardul</span>
                <span className="text-xs text-white/50">• În curând (disabled)</span>
              </label>
            </div>
          </div>

          {errors.submit && (
            <p className="rounded-xl bg-red-500/20 px-4 py-3 text-sm text-red-300">
              {errors.submit}
            </p>
          )}

          {/* Rezumat + Submit */}
          <div className="rounded-2xl border border-white/20 bg-white/5 p-4">
            <div className="mb-4 flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>{total.toFixed(2)} lei</span>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-white py-4 font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Se trimite..." : "Plasează comanda"}
            </button>
          </div>
        </form>

        <AddressSelector
          selectedId={selectedAddress?.id ?? null}
          onSelect={handleSelectAddress}
          open={showAddressSelector}
          onClose={() => setShowAddressSelector(false)}
        />
      </div>
    </main>
  );
}

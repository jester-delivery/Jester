"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useJester24CartStore } from "@/stores/jester24CartStore";
import { useAuthStore } from "@/stores/authStore";
import { useAuthReady } from "@/hooks/useAuthReady";
import { useDeliveryAddressStore } from "@/stores/deliveryAddressStore";
import { api, type Address } from "@/lib/api";
import { PRODUCT_DELIVERY_FEE, VAT_RATE } from "@/lib/config/delivery";
import AddressSelector from "@/components/checkout/AddressSelector";
import Toast from "@/components/ui/Toast";
import { ORDER_PLACED_TOAST } from "@/lib/jesterToasts";

function formatAddressForOrder(addr: Address) {
  const parts = [addr.street];
  if (addr.number) parts.push(`nr. ${addr.number}`);
  if (addr.details) parts.push(addr.details);
  parts.push(addr.city);
  return parts.join(", ");
}

export default function CheckoutPage() {
  const router = useRouter();
  const authReady = useAuthReady();
  const { isAuthenticated, user } = useAuthStore();
  const items = useJester24CartStore((s) => s.items);
  const getTotalPrice = useJester24CartStore((s) => s.getTotalPrice);
  const clearCart = useJester24CartStore((s) => s.clear);
  const deliveryStoreAddress = useDeliveryAddressStore((s) => s.address);
  const setDeliveryStoreAddress = useDeliveryAddressStore((s) => s.setAddress);

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
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const submittedRef = useRef(false);
  const idempotencyKeyRef = useRef<string | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    const fromStore = (deliveryStoreAddress || "").trim();
    if (fromStore.length >= 5) {
      setAddress(fromStore);
      setShowAddressInput(false);
    }
    api.me
      .getAddresses()
      .then((res) => {
        const addrs = res.data.addresses ?? [];
        const defaultAddr = addrs.find((a) => a.isDefault) ?? addrs[0];
        const fromStoreNow = (deliveryStoreAddress || "").trim();
        if (fromStoreNow.length >= 5) {
          setAddress(fromStoreNow);
          setShowAddressInput(false);
          return;
        }
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
      .catch(() => {
        if ((deliveryStoreAddress || "").trim().length < 5) setShowAddressInput(true);
      });
  }, [mounted, isAuthenticated, user, deliveryStoreAddress]);

  useEffect(() => {
    if (!mounted || !authReady) return;
    if (!isAuthenticated || !user) {
      const token = typeof window !== "undefined" ? localStorage.getItem("jester_token") : null;
      if (token) return;
      router.replace("/login?next=" + encodeURIComponent("/jester-24-24/checkout"));
    }
  }, [mounted, authReady, isAuthenticated, user, router]);

  // Autocomplete: străzi la căutare; după alegerea străzii, sugestii de numere (clientul poate alege sau completa manual)
  const isStreetOnly = (v: string) => {
    const t = v.trim();
    return t.length >= 5 && (/(Str\.|Aleea)\s+.+,\s*Sulina\s*$/i.test(t)) && !/\bnr\.\s*\d+/i.test(t);
  };
  useEffect(() => {
    const q = address.trim();
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!q) {
      api.addresses
        .list()
        .then((res) => {
          setAddressSuggestions(res.data.suggestions ?? []);
        })
        .catch(() => setAddressSuggestions([]));
      return;
    }
    if (q.length < 2) {
      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
      return;
    }
    searchTimeoutRef.current = setTimeout(() => {
      if (isStreetOnly(q)) {
        api.addresses
          .streetNumbers(q)
          .then((res) => {
            setAddressSuggestions(res.data.suggestions ?? []);
            setShowAddressSuggestions(true);
          })
          .catch(() => setAddressSuggestions([]));
      } else {
        api.addresses
          .search(q)
          .then((res) => {
            setAddressSuggestions(res.data.suggestions ?? []);
            setShowAddressSuggestions(true);
          })
          .catch(() => setAddressSuggestions([]));
      }
    }, 200);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [address]);

  // Subtotal = doar produse; livrare 7 lei; total = subtotal + livrare
  const subtotal = mounted ? getTotalPrice() : 0;
  const deliveryFee = PRODUCT_DELIVERY_FEE;
  const total = subtotal + deliveryFee;

  const isValidROPhone = (ph: string) => {
    const digits = ph.replace(/\D/g, "");
    return (digits.length === 10 && /^07/.test(digits)) || (digits.length === 12 && /^40/.test(digits));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    const addr = address.trim();
    const ph = phone.trim();
    const nm = name.trim();

    if (items.length === 0) {
      e.cart = "Coșul este gol. Adaugă produse înainte de a plasa comanda.";
    }
    const totalVal = Number(getTotalPrice());
    if (items.length > 0 && (Number.isNaN(totalVal) || totalVal <= 0)) {
      e.cart = "Total invalid. Verifică coșul și încearcă din nou.";
    }
    if (!addr || addr.length < 5) {
      e.address = "Adresa de livrare este obligatorie. Introdu o adresă din Sulina sau alege din listă.";
    }
    if (!ph || ph.length < 8) {
      e.phone = "Telefonul este obligatoriu (min. 8 caractere).";
    } else if (!isValidROPhone(ph)) {
      e.phone = "Telefon invalid. Formate: 07xx xxx xxx sau +40 7xx xxx xxx.";
    }
    if (!nm || nm.length < 2) {
      e.name = "Numele clientului este obligatoriu (min. 2 caractere).";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittedRef.current) return;
    setErrors({});
    if (items.length === 0) {
      setErrors({ cart: "Coșul este gol. Adaugă produse înainte de a plasa comanda." });
      return;
    }
    if (Number(getTotalPrice()) <= 0) {
      setErrors({ cart: "Total invalid. Verifică coșul și încearcă din nou." });
      return;
    }
    if (!validate()) return;

    submittedRef.current = true;
    setLoading(true);
    setErrors({});
    try {
      const subtotalNum = Number(getTotalPrice());
      const totalNum = Math.round((subtotalNum + PRODUCT_DELIVERY_FEE) * 100) / 100;
      const payload = {
        orderType: "product_order" as const,
        total: totalNum,
        items: items.map((i) => ({
          name: String(i.name),
          price: Number(i.price),
          quantity: Math.max(1, Math.floor(Number(i.qty) || 1)),
          productId: i.id,
        })),
        deliveryAddress: address.trim(),
        phone: phone.trim(),
        name: name.trim(),
        notes: notes.trim() || undefined,
        paymentMethod: (paymentMethod === "cash" ? "CASH_ON_DELIVERY" : "CARD") as "CASH_ON_DELIVERY" | "CARD",
      };

      if (!idempotencyKeyRef.current) {
        idempotencyKeyRef.current = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `ck-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
      }
      await api.cartOrders.create(payload, { idempotencyKey: idempotencyKeyRef.current });
      clearCart();
      setToastMessage(ORDER_PLACED_TOAST);
      setTimeout(() => {
        router.push("/orders?placed=1");
      }, 600);
    } catch (err: unknown) {
      submittedRef.current = false;
      const res = (err as { response?: { data?: { error?: string; code?: string }; status?: number } })?.response;
      const msg =
        res?.status === 409 && res?.data?.code === "TOTAL_MISMATCH"
          ? "Prețurile s-au actualizat. Reîmprospătează pagina și plasează din nou comanda."
          : res?.data?.error || "Eroare la plasarea comenzii. Încearcă din nou.";
      setErrors({ submit: msg });
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

  if (!mounted || !authReady || (!isAuthenticated && typeof window !== "undefined" && localStorage.getItem("jester_token"))) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#050610] via-[#040411] to-[#050610] pb-24 text-white">
        <div className="mx-auto max-w-2xl px-4 py-12 text-center">
          <p className="text-white/70">Se încarcă...</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#050610] via-[#040411] to-[#050610] pb-24 text-white">
        <div className="mx-auto max-w-2xl px-4 py-12 text-center">
          <p className="text-white/90 font-medium">Trebuie să fii autentificat pentru checkout.</p>
          <p className="mt-2 text-white/60 text-sm">Se redirecționează la login...</p>
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#050610] via-[#040411] to-[#050610] pb-24 text-white">
        <div className="mx-auto max-w-2xl px-4 py-12">
          <p className="text-white/90 font-medium">Coșul este gol.</p>
          <p className="mt-1 text-white/60 text-sm">Adaugă produse înainte de a plasa comanda.</p>
          <Link
            href="/jester-24-24"
            className="mt-4 inline-block rounded-xl bg-amber-500 px-4 py-2 font-semibold text-black hover:bg-amber-400"
          >
            Înapoi la Jester 24/24
          </Link>
        </div>
      </main>
    );
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

        {errors.cart && (
          <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/20 px-5 py-4 flex items-start gap-3">
            <span className="shrink-0 mt-0.5 text-red-300" aria-hidden>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            <p className="text-sm font-medium text-red-200">{errors.cart}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
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
              <div className="relative">
                <input
                  ref={addressInputRef}
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  onFocus={() => setShowAddressSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowAddressSuggestions(false), 150)}
                  placeholder="Scrie adresa (ex: Str. 1 Decembrie) și alege din listă"
                  className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-amber-500/60 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
                  required
                  minLength={5}
                  autoComplete="off"
                />
                <p className="mt-1 text-xs text-white/50">Livrăm doar în Sulina. Poți alege din listă sau introduce o adresă nouă (ex: Str. 2 nr. 5, Sulina).</p>
                {showAddressSuggestions && addressSuggestions.length > 0 && (
                  <ul
                    className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto rounded-xl border border-white/20 bg-[#0a0a12] shadow-xl"
                    role="listbox"
                  >
                    {addressSuggestions.map((s) => (
                      <li
                        key={s}
                        role="option"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setAddress(s);
                          setShowAddressSuggestions(false);
                          setDeliveryStoreAddress(s);
                        }}
                        className="px-4 py-3 text-sm text-white/90 hover:bg-white/10 cursor-pointer border-b border-white/5 last:border-0"
                      >
                        {s}
                      </li>
                    ))}
                  </ul>
                )}
                {errors.address && (
                  <p className="mt-1 text-sm text-red-400">{errors.address}</p>
                )}
              </div>
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
            <div className="rounded-2xl border border-red-500/30 bg-red-500/20 px-5 py-4 flex items-start gap-3">
              <span className="shrink-0 mt-0.5 text-red-300" aria-hidden>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <p className="text-sm font-medium text-red-200">{errors.submit}</p>
            </div>
          )}

          {/* Rezumat: subtotal, livrare, TVA inclus, total + text legal */}
          <div className="rounded-2xl border border-white/20 bg-white/5 p-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-white/80">
                <span>Subtotal produse</span>
                <span>{subtotal.toFixed(2)} lei</span>
              </div>
              <div className="flex justify-between text-white/80">
                <span>Livrare</span>
                <span>{deliveryFee} lei</span>
              </div>
              <p className="text-xs text-white/50 pt-1">
                TVA inclus ({(VAT_RATE * 100).toFixed(0)}% calculat din total produse).
              </p>
            </div>
            <div className="mt-4 mb-4 flex justify-between text-lg font-bold border-t border-white/10 pt-4">
              <span>Total final</span>
              <span>{total.toFixed(2)} lei</span>
            </div>
            <p className="text-xs text-white/50 mb-4">
              Prețurile afișate includ TVA.
            </p>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-white py-3.5 font-semibold text-black transition hover:bg-white/95 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2"
            >
              {loading && (
                <svg className="animate-spin h-5 w-5 text-black" fill="none" viewBox="0 0 24 24" aria-hidden>
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
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
      <Toast message={toastMessage} />
    </main>
  );
}

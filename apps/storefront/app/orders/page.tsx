"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BottomNavigation from "@/components/ui/BottomNavigation";
import Toast from "@/components/ui/Toast";
import { api, type Order } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "În așteptare",
  CONFIRMED: "Acceptată",
  PREPARING: "Se pregătește",
  READY: "Gata",
  DELIVERING: "În livrare",
  ON_THE_WAY: "În drum",
  OUT_FOR_DELIVERY: "În drum",
  DELIVERED: "Livrată",
  CANCELLED: "Anulată",
  CANCELED: "Anulată",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("ro-RO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_TOAST: Record<string, string> = {
  CONFIRMED: "Comanda ta a fost acceptată!",
  PREPARING: "Comanda ta se pregătește.",
  ON_THE_WAY: "Comanda ta e în drum spre tine!",
  OUT_FOR_DELIVERY: "Comanda ta e în drum spre tine!",
  DELIVERED: "Comanda ta a fost livrată.",
  CANCELED: "Comanda ta a fost anulată.",
  CANCELLED: "Comanda ta a fost anulată.",
};

export default function OrdersPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const prevOrdersRef = useRef<Order[]>([]);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, 3500);
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await api.orders.getMy();
      const newOrders = res.data.orders ?? [];
      setOrders(newOrders);
      setError(null);

      // Detectare schimbare status → toast (doar după prima încărcare)
      if (prevOrdersRef.current.length > 0) {
        for (const newOrder of newOrders) {
          const prev = prevOrdersRef.current.find((o) => o.id === newOrder.id);
          if (prev && prev.status !== newOrder.status) {
            const msg = STATUS_TOAST[newOrder.status] ?? `Comanda ta: ${STATUS_LABEL[newOrder.status] ?? newOrder.status}`;
            showToast(msg);
            break; // un singur toast per refresh
          }
        }
      }
      prevOrdersRef.current = newOrders;
    } catch {
      setError("Nu s-au putut încărca comenzile.");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Redirect la login dacă nu e autentificat
  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.replace("/login?next=" + encodeURIComponent("/orders"));
    }
  }, [isAuthenticated, user, router]);

  // Fetch inițial + polling la 7 sec
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      fetchOrders();
    };
    run();
    const interval = setInterval(run, 7000);
    return () => {
      cancelled = true;
      clearInterval(interval);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, [isAuthenticated, user, fetchOrders]);

  if (!isAuthenticated || !user) {
    return (
      <main className="min-h-screen text-white bg-gradient-to-b from-[#050610] via-[#040411] to-[#050610] pb-24 flex items-center justify-center">
        <p className="text-white/70">Se redirecționează la login...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen text-white bg-gradient-to-b from-[#050610] via-[#040411] to-[#050610] pb-24">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">
          Comenzile mele
        </h1>

        {loading && (
          <p className="mt-6 text-white/70">Se încarcă...</p>
        )}

        {error && (
          <p className="mt-6 text-red-300">{error}</p>
        )}

        {!loading && !error && orders.length === 0 && (
          <p className="mt-6 text-white/70">Nu ai comenzi încă.</p>
        )}

        {!loading && !error && orders.length > 0 && (
          <ul className="mt-6 space-y-4">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/orders/${order.id}`}
                  className="block rounded-2xl border border-white/20 bg-white/10 p-4 transition hover:border-white/30 hover:bg-white/15"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm text-white/70">
                      {formatDate(order.createdAt)}
                    </span>
                    <span
                      className={`rounded-lg px-2 py-1 text-xs font-semibold ${
                        order.status === "DELIVERED"
                          ? "bg-green-500/20 text-green-300"
                          : order.status === "CANCELLED" || order.status === "CANCELED"
                            ? "bg-red-500/20 text-red-300"
                            : order.status === "ON_THE_WAY" || order.status === "OUT_FOR_DELIVERY"
                              ? "bg-blue-500/20 text-blue-300"
                              : "bg-amber-500/20 text-amber-300"
                      }`}
                    >
                      {STATUS_LABEL[order.status] ?? order.status}
                    </span>
                  </div>
                  <p className="mt-2 text-lg font-bold text-white">
                    Total: {Number(order.total).toFixed(2)} lei
                  </p>
                  <p className="mt-1 text-sm text-white/60">
                    {order.items.length} produs(e)
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Toast message={toastMessage} />
      <BottomNavigation />
    </main>
  );
}

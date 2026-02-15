"use client";

import { Suspense, useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import BottomNavigation from "@/components/ui/BottomNavigation";
import Toast from "@/components/ui/Toast";
import { api, type Order } from "@/lib/api";
import { getOrderStatusClass, ORDER_STATUS_LABEL } from "@/lib/orderStatus";
import { useAuthStore } from "@/stores/authStore";

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
const STATUS_LABEL = ORDER_STATUS_LABEL;

function OrderCard({
  order,
  formatDate,
}: {
  order: Order;
  formatDate: (iso: string) => string;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <li className="rounded-2xl border border-white/20 bg-white/10 overflow-hidden transition hover:border-white/30">
      <Link href={`/orders/${order.id}`} className="block p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-medium text-white/90">
            #{typeof order.id === "string" ? order.id.slice(0, 8) : ""} · {formatDate(order.createdAt)}
          </span>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${getOrderStatusClass(order.status)}`}
          >
            {ORDER_STATUS_LABEL[order.status] ?? order.status}
          </span>
        </div>
        <div className="mt-3 flex items-baseline justify-between gap-2">
          <span className="text-xl font-bold text-white">
            {Number(order.total).toFixed(2)} lei
          </span>
          <span className="text-sm text-white/60">
            {order.items.length} produs(e)
          </span>
        </div>
      </Link>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          setExpanded((x) => !x);
        }}
        className="w-full border-t border-white/10 px-4 py-2.5 text-sm font-medium text-amber-400 hover:bg-white/5 transition"
      >
        {expanded ? "Ascunde produse" : "Arată produse"}
      </button>
      {expanded && (
        <div className="border-t border-white/10 bg-white/5 px-4 py-3">
          <ul className="space-y-2">
            {order.items.map((item) => (
              <li
                key={item.id}
                className="flex justify-between text-sm text-white/90"
              >
                <span>{item.name}</span>
                <span className="text-white/70">
                  {item.quantity} × {Number(item.price).toFixed(2)} lei
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}

function OrdersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const placedSuccess = searchParams.get("placed") === "1";
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
    const interval = setInterval(run, 12000);
    return () => {
      cancelled = true;
      clearInterval(interval);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, [isAuthenticated, user, fetchOrders]);

  // Re-fetch la focus/visibility: după ce revii de pe order detail (SSE acolo), list-ul se actualizează
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const onVisibility = () => {
      if (document.visibilityState === "visible") fetchOrders();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
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

        {placedSuccess && (
          <div className="mt-4 rounded-2xl border border-green-500/30 bg-green-500/20 px-5 py-4 flex items-start gap-3">
            <span className="shrink-0 mt-0.5 text-green-300" aria-hidden>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <p className="font-medium text-green-300">Comanda a fost plasată cu succes.</p>
          </div>
        )}

        {loading && (
          <div className="mt-6 space-y-4" aria-busy="true" aria-label="Se încarcă comenzile">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/20 bg-white/10 overflow-hidden p-4 animate-pulse"
              >
                <div className="flex justify-between gap-2">
                  <div className="h-4 w-24 rounded bg-white/20" />
                  <div className="h-5 w-20 rounded-full bg-white/20" />
                </div>
                <div className="mt-3 h-6 w-20 rounded bg-white/20" />
                <div className="mt-2 h-4 w-28 rounded bg-white/10" />
              </div>
            ))}
          </div>
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
              <OrderCard key={order.id} order={order} formatDate={formatDate} />
            ))}
          </ul>
        )}
      </div>
      <Toast message={toastMessage} />
      <BottomNavigation />
    </main>
  );
}

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen text-white bg-gradient-to-b from-[#050610] via-[#040411] to-[#050610] pb-24 flex items-center justify-center">
          <p className="text-white/70">Se încarcă...</p>
        </main>
      }
    >
      <OrdersPageContent />
    </Suspense>
  );
}

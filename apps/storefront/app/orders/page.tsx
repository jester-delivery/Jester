"use client";

import { Suspense, useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Trash2 } from "lucide-react";
import BottomNavigation from "@/components/ui/BottomNavigation";
import Toast from "@/components/ui/Toast";
import { api, type Order } from "@/lib/api";
import { getOrderStatusClass, ORDER_STATUS_LABEL, PACKAGE_ORDER_STATUS_LABEL } from "@/lib/orderStatus";
import { ORDER_STATUS_TOAST, REFUSAL_TOAST, ORDER_DELETED_TOAST, ORDER_DELETE_ERROR_TOAST, TOAST_DURATION_MS } from "@/lib/jesterToasts";
import { useAuthStore } from "@/stores/authStore";
import { useAuthReady } from "@/hooks/useAuthReady";

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

const STATUS_TOAST = ORDER_STATUS_TOAST;
const STATUS_LABEL = ORDER_STATUS_LABEL;

const DELETABLE_STATUS = "PENDING";

function OrderCard({
  order,
  formatDate,
  onDelete,
  showToast,
}: {
  order: Order;
  formatDate: (iso: string) => string;
  onDelete: (order: Order) => void;
  showToast: (msg: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const canDelete = order.status === DELETABLE_STATUS;

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canDelete) return;
    setConfirmOpen(true);
  };

  const handleConfirmDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirmOpen(false);
    onDelete(order);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirmOpen(false);
  };

  // Închide modal la Escape (accesibilitate)
  useEffect(() => {
    if (!confirmOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setConfirmOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [confirmOpen]);

  return (
    <li className="rounded-2xl border border-white/20 bg-white/10 overflow-hidden transition hover:border-white/30 relative">
      <Link href={`/orders/${order.id}`} className="block p-4 pr-12">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-medium text-white/90">
            #{typeof order.id === "string" ? order.id.slice(0, 8) : ""} · {formatDate(order.createdAt)}
          </span>
          {(() => {
            const isCanceled = order.status === "CANCELLED" || order.status === "CANCELED";
            const isRefusedFinal = isCanceled && !!order.lastCourierRefusedAt;
            const isSearchingCourier = order.status === "PENDING" && !!order.lastCourierRefusedAt;
            const label = isRefusedFinal
              ? "Refuzată"
              : isSearchingCourier
                ? "Căutăm curier"
                : (order.orderType === "package_delivery" ? PACKAGE_ORDER_STATUS_LABEL : ORDER_STATUS_LABEL)[order.status] ??
                  order.status;
            const cls = isSearchingCourier ? "bg-amber-500/25 text-amber-300" : getOrderStatusClass(order.status);
            return (
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>
                {label}
              </span>
            );
          })()}
        </div>
        <div className="mt-3 flex items-baseline justify-between gap-2">
          <span className="text-xl font-bold text-white">
            {Number(order.total).toFixed(2)} lei
          </span>
          <span className="text-sm text-white/60">
            {order.items.length} produs(e)
          </span>
        </div>
        {(order.status === "PENDING" && order.lastCourierRefusedAt) || ((order.status === "CANCELLED" || order.status === "CANCELED") && order.lastCourierRefusedAt)
          ? order.lastCourierRefusedReason?.trim() && (
              <p className="mt-2 text-xs text-white/50 italic">Motiv refuz: {order.lastCourierRefusedReason}</p>
            )
          : null}
      </Link>
      {canDelete ? (
        <button
          type="button"
          onClick={handleDeleteClick}
          className="absolute top-3 right-3 p-2 rounded-lg text-white/60 hover:text-red-400 hover:bg-white/10 transition"
          title="Șterge comandă"
          aria-label="Șterge comandă"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ) : null}
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

      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={handleCancelDelete}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-order-title"
        >
          <div
            className="rounded-2xl border border-white/20 bg-[#0a0a12] p-5 max-w-sm w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="delete-order-title" className="text-lg font-semibold text-white">
              Ștergi comanda?
            </h2>
            <p className="mt-2 text-sm text-white/70">
              Acțiunea nu poate fi anulată.
            </p>
            <div className="mt-6 flex gap-3 justify-end">
              <button
                type="button"
                onClick={handleCancelDelete}
                className="px-4 py-2 rounded-xl text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition"
              >
                Anulează
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-500 transition"
              >
                Șterge
              </button>
            </div>
          </div>
        </div>
      )}
    </li>
  );
}

function OrdersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const placedSuccess = searchParams.get("placed") === "1";
  const authReady = useAuthReady();
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
    }, TOAST_DURATION_MS);
  }, []);

  const fetchOrders = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await api.orders.getMy({ signal });
      const newOrders = res.data.orders ?? [];
      setOrders(newOrders);
      setError(null);

      // Detectare schimbare status sau refuz curier → toast (doar după prima încărcare)
      if (prevOrdersRef.current.length > 0) {
        for (const newOrder of newOrders) {
          const prev = prevOrdersRef.current.find((o) => o.id === newOrder.id);
          if (!prev) continue;
          const refusedNow = !!newOrder.lastCourierRefusedAt && !prev.lastCourierRefusedAt;
          if (refusedNow) {
            showToast(REFUSAL_TOAST);
            break;
          }
          if (prev.status !== newOrder.status) {
            const msg = STATUS_TOAST[newOrder.status] ?? `Comanda ta: ${STATUS_LABEL[newOrder.status] ?? newOrder.status}`;
            showToast(msg);
            break;
          }
        }
      }
      prevOrdersRef.current = newOrders;
    } catch (err: unknown) {
      if ((err as { name?: string })?.name === "AbortError") return;
      setError("Nu s-au putut încărca comenzile.");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const handleDeleteOrder = useCallback(
    async (order: Order) => {
      setOrders((prev) => prev.filter((o) => o.id !== order.id));
      showToast(ORDER_DELETED_TOAST);
      try {
        await api.orders.delete(order.id);
      } catch (err: any) {
        const status = err.response?.status;
        // 400/404 = deja ștearsă sau invalidă – nu mai afișăm eroare, list-ul e deja actualizat
        if (status === 400 || status === 404) return;
        showToast(ORDER_DELETE_ERROR_TOAST);
        fetchOrders();
      }
    },
    [showToast, fetchOrders]
  );

  // Redirect la login doar după rehidratare și doar dacă nu există token
  useEffect(() => {
    if (!authReady) return;
    if (!isAuthenticated || !user) {
      const token = typeof window !== "undefined" ? localStorage.getItem("jester_token") : null;
      if (token) return;
      router.replace("/login?next=" + encodeURIComponent("/orders"));
    }
  }, [authReady, isAuthenticated, user, router]);

  // Fetch inițial + polling; AbortController anulează request la unmount
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const controller = new AbortController();
    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      fetchOrders(controller.signal);
    };
    run();
    const pollMs = orders.some((o) => o.status === "PENDING") ? 5000 : 12000;
    const interval = setInterval(run, pollMs);
    return () => {
      cancelled = true;
      controller.abort();
      clearInterval(interval);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, [isAuthenticated, user, fetchOrders, orders]);

  // Re-fetch la focus/visibility: după ce revii de pe order detail (SSE acolo), list-ul se actualizează
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const onVisibility = () => {
      if (document.visibilityState === "visible") fetchOrders();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [isAuthenticated, user, fetchOrders]);

  if (!authReady || (!isAuthenticated && typeof window !== "undefined" && localStorage.getItem("jester_token"))) {
    return (
      <main className="min-h-screen text-white bg-gradient-to-b from-[#050610] via-[#040411] to-[#050610] pb-24 flex items-center justify-center">
        <p className="text-white/70">Se încarcă...</p>
      </main>
    );
  }
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
              <OrderCard
                key={order.id}
                order={order}
                formatDate={formatDate}
                onDelete={handleDeleteOrder}
                showToast={showToast}
              />
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

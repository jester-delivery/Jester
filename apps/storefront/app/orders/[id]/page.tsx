"use client";

import { Suspense, useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import BottomNavigation from "@/components/ui/BottomNavigation";
import Toast from "@/components/ui/Toast";
import { api, type Order } from "@/lib/api";
import { getOrderStatusClass, ORDER_STATUS_LABEL, PACKAGE_ORDER_STATUS_LABEL } from "@/lib/orderStatus";
import { useAuthStore } from "@/stores/authStore";
import { useAuthReady } from "@/hooks/useAuthReady";
import { useOrderStream } from "@/lib/useOrderStream";
import OrderStatusTimeline from "@/components/orders/OrderStatusTimeline";

const LIVE_STATUSES = ["PENDING", "ACCEPTED", "CONFIRMED", "PREPARING", "ON_THE_WAY", "OUT_FOR_DELIVERY"];
const STATUS_TOAST: Record<string, string> = {
  ACCEPTED: "Comanda ta a fost acceptată!",
  CONFIRMED: "Comanda ta a fost acceptată!",
  PREPARING: "Comanda ta se pregătește.",
  ON_THE_WAY: "Comanda ta e în drum spre tine!",
  OUT_FOR_DELIVERY: "Comanda ta e în drum spre tine!",
  DELIVERED: "Comanda ta a fost livrată.",
  CANCELED: "Comanda ta a fost anulată.",
  CANCELLED: "Comanda ta a fost anulată.",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ro-RO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function OrderDetailContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const justPlaced = searchParams.get("placed") === "1";
  const authReady = useAuthReady();
  const { isAuthenticated, user } = useAuthStore();
  const id = params?.id as string | undefined;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const token = useAuthStore((s) => s.token);

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, 3500);
  }, []);

  const lastStatusToastRef = useRef<{ status: string; at: number } | null>(null);
  const TOAST_DEDUPE_MS = 4000;

  const handleStatusChange = useCallback(
    (status: string, payload: unknown) => {
      const p = payload && typeof payload === "object" ? (payload as { order?: Order; reason?: string }) : {};
      if (p.order) setOrder(p.order);
      const isRefusal = p.reason === "courier_refused";
      if (isRefusal) {
        showToast("Un curier a refuzat comanda. Căutăm alt curier.");
        if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([100, 50, 100]);
        return;
      }
      const now = Date.now();
      const last = lastStatusToastRef.current;
      if (last && last.status === status && now - last.at < TOAST_DEDUPE_MS) return;
      lastStatusToastRef.current = { status, at: now };
      const msg = STATUS_TOAST[status] ?? `Comanda ta: ${ORDER_STATUS_LABEL[status] ?? status}`;
      showToast(msg);
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
    },
    [showToast]
  );

  useOrderStream(id ?? undefined, token, !!order && LIVE_STATUSES.includes(order.status), handleStatusChange);

  const fetchOrder = useCallback(async () => {
    if (!id || typeof id !== "string" || id.trim() === "") {
      setError("Comanda nu a fost găsită.");
      setLoading(false);
      return;
    }
    try {
      const res = await api.orders.getById(id);
      setOrder(res.data.order);
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 403) {
        setError("Această comandă nu îți aparține.");
      } else {
        setError("Comanda nu a fost găsită.");
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!authReady) return;
    if (!isAuthenticated || !user) {
      const token = typeof window !== "undefined" ? localStorage.getItem("jester_token") : null;
      if (token) return;
      router.replace("/login?next=" + encodeURIComponent("/orders/" + (id || "")));
    }
  }, [authReady, isAuthenticated, user, router, id]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    if (!id || typeof id !== "string" || id.trim() === "") {
      setError("Comanda nu a fost găsită.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetchOrder();
  }, [id, isAuthenticated, user, fetchOrder]);

  /* SSE înlocuiește polling - useOrderStream se ocupă de update-uri real-time */

  if (!authReady || (!isAuthenticated && typeof window !== "undefined" && localStorage.getItem("jester_token"))) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#050610] via-[#040411] to-[#050610] pb-24 text-white flex items-center justify-center">
        <p className="text-white/70">Se încarcă...</p>
        <BottomNavigation />
      </main>
    );
  }
  if (!isAuthenticated || !user) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#050610] via-[#040411] to-[#050610] pb-24 text-white flex items-center justify-center">
        <p className="text-white/70">Se redirecționează la login...</p>
        <BottomNavigation />
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#050610] via-[#040411] to-[#050610] pb-24 text-white">
        <div className="mx-auto max-w-4xl px-4 py-8 animate-pulse">
          <div className="h-4 w-32 rounded bg-white/20" />
          <div className="mt-4 h-8 w-48 rounded bg-white/20" />
          <div className="mt-2 h-4 w-56 rounded bg-white/10" />
          <div className="mt-4 h-6 w-24 rounded-full bg-white/20" />
          <div className="mt-6 space-y-3">
            <div className="h-12 rounded-xl bg-white/10" />
            <div className="h-12 rounded-xl bg-white/10" />
            <div className="h-12 rounded-xl bg-white/10" />
          </div>
        </div>
        <BottomNavigation />
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#050610] via-[#040411] to-[#050610] pb-24 text-white">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="rounded-2xl border border-red-500/30 bg-red-500/20 px-5 py-4">
            <p className="font-medium text-red-200">{error ?? "Comanda nu a fost găsită."}</p>
            <p className="mt-1 text-sm text-red-200/80">Poți verifica comenzile tale în lista de comenzi.</p>
          </div>
          <Link
            href="/orders"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white/10 border border-white/20 px-4 py-2.5 font-medium text-white hover:bg-white/15 transition"
          >
            ← Înapoi la comenzi
          </Link>
        </div>
        <BottomNavigation />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#050610] via-[#040411] to-[#050610] pb-24 text-white">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Link href="/orders" className="text-sm text-white/70 underline">
          ← Comenzile mele
        </Link>
        {justPlaced && (
          <div className="mt-4 rounded-2xl border border-green-500/30 bg-green-500/20 px-5 py-4 flex items-start gap-3">
            <span className="shrink-0 mt-0.5 text-green-300" aria-hidden>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <div>
              <p className="font-semibold text-green-300">Comandă plasată cu succes</p>
              <p className="mt-1 text-sm text-green-200/90">Comanda ta a fost trimisă. Poți urmări statusul mai jos.</p>
            </div>
          </div>
        )}
        <h1 className="mt-4 text-2xl font-bold">Comandă #{order.id.slice(0, 8)}</h1>
        <p className="mt-1 text-white/70">{formatDate(order.createdAt)}</p>
        {/* package_delivery = Jester Delivery (pachete); product_order sau lipsă = food, flow neschimbat */}
        {order.orderType === "package_delivery" ? (
          <p className="mt-1 text-sm text-white/60">Jester Delivery – livrare pachet</p>
        ) : (
          <>
            {order.estimatedDeliveryMinutes != null ? (
              <p className="mt-1 text-sm text-amber-300/90">
                Livrare estimată: ~{order.estimatedDeliveryMinutes} min
              </p>
            ) : (
              <p className="mt-1 text-sm text-white/60">Livrare estimată: ~30 min</p>
            )}
          </>
        )}
        {LIVE_STATUSES.includes(order.status) && (
          <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-green-500/20 px-3 py-1 text-xs font-semibold text-green-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
            Comandă live
          </span>
        )}
        <span
          className={`mt-2 inline-block rounded-full px-3 py-1 text-sm font-semibold ${getOrderStatusClass(order.status)}`}
        >
          {(order.orderType === "package_delivery" ? PACKAGE_ORDER_STATUS_LABEL : ORDER_STATUS_LABEL)[order.status] ?? order.status}
        </span>

        <OrderStatusTimeline status={order.status} orderType={order.orderType} />

        {order.orderType === "package_delivery" && (
          <div className="mt-4 rounded-2xl border border-white/20 bg-white/5 p-4">
            <p className="text-sm font-semibold text-white/80">Legătură curier</p>
            <p className="mt-1 text-sm text-white/60">Curier: se alocă…</p>
          </div>
        )}

        {order.paymentMethod && (
          <p className="mt-2 text-sm text-white/70">
            Plată: {order.paymentMethod === "CARD" ? "Card" : "La livrare"}
          </p>
        )}
        {order.deliveryAddress && (
          <p className="mt-2 text-sm text-white/70">
            Adresă: {order.deliveryAddress}
          </p>
        )}
        {order.phone && (
          <p className="mt-1 text-sm text-white/70">Telefon: {order.phone}</p>
        )}

        <ul className="mt-6 space-y-3">
          {order.items.map((item) => (
            <li
              key={item.id}
              className="flex justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3"
            >
              <span className="text-white">{item.name}</span>
              <span className="text-white/70">
                {item.quantity} × {Number(item.price).toFixed(2)} lei ={" "}
                {(item.quantity * Number(item.price)).toFixed(2)} lei
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex justify-between border-t border-white/20 pt-4 text-lg font-bold">
          <span>Total</span>
          <span>{Number(order.total).toFixed(2)} lei</span>
        </div>
      </div>
      <Toast message={toastMessage} />
      <BottomNavigation />
    </main>
  );
}

export default function OrderDetailPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center text-white bg-gradient-to-b from-[#050610] via-[#040411] to-[#050610]">
        <p className="text-white/70">Se încarcă...</p>
      </main>
    }>
      <OrderDetailContent />
    </Suspense>
  );
}

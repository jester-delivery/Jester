"use client";

import { Suspense, useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import BottomNavigation from "@/components/ui/BottomNavigation";
import Toast from "@/components/ui/Toast";
import { api, type Order } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { useOrderStream } from "@/lib/useOrderStream";
import OrderStatusTimeline from "@/components/orders/OrderStatusTimeline";

const LIVE_STATUSES = ["PENDING", "CONFIRMED", "PREPARING", "ON_THE_WAY", "OUT_FOR_DELIVERY"];
const STATUS_TOAST: Record<string, string> = {
  CONFIRMED: "Comanda ta a fost acceptată!",
  PREPARING: "Comanda ta se pregătește.",
  ON_THE_WAY: "Comanda ta e în drum spre tine!",
  OUT_FOR_DELIVERY: "Comanda ta e în drum spre tine!",
  DELIVERED: "Comanda ta a fost livrată.",
  CANCELED: "Comanda ta a fost anulată.",
  CANCELLED: "Comanda ta a fost anulată.",
};
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

  const handleStatusChange = useCallback(
    (status: string, orderPayload: unknown) => {
      if (orderPayload && typeof orderPayload === "object" && "status" in orderPayload) {
        setOrder(orderPayload as Order);
      }
      const msg = STATUS_TOAST[status] ?? `Comanda ta: ${STATUS_LABEL[status] ?? status}`;
      showToast(msg);
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
    },
    [showToast]
  );

  useOrderStream(id ?? undefined, token, !!order && LIVE_STATUSES.includes(order.status), handleStatusChange);

  const fetchOrder = useCallback(async () => {
    if (!id) return null;
    try {
      const res = await api.orders.getById(id);
      return res.data.order;
    } catch {
      return null;
    }
  }, [id]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.replace("/login?next=" + encodeURIComponent("/orders/" + (id || "")));
    }
  }, [isAuthenticated, user, router, id]);

  useEffect(() => {
    if (!id || !isAuthenticated || !user) return;
    let cancelled = false;
    fetchOrder().then((o) => {
      if (!cancelled && o) {
        setOrder(o);
        setLoading(false);
      } else if (!cancelled && !o) {
        setError("Comanda nu a fost găsită.");
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [id, isAuthenticated, user, fetchOrder]);

  /* SSE înlocuiește polling - useOrderStream se ocupă de update-uri real-time */

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
        <div className="mx-auto max-w-4xl px-4 py-8">
          <p className="text-white/70">Se încarcă...</p>
        </div>
        <BottomNavigation />
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#050610] via-[#040411] to-[#050610] pb-24 text-white">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <p className="text-red-300">{error ?? "Comandă negăsită."}</p>
          <Link href="/orders" className="mt-4 inline-block text-white/80 underline">
            Înapoi la comenzi
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
          <p className="mt-4 rounded-xl bg-green-500/20 px-4 py-3 text-green-300 font-medium">
            Comanda ta a fost trimisă ✓
          </p>
        )}
        <h1 className="mt-4 text-2xl font-bold">Comandă #{order.id.slice(0, 8)}</h1>
        <p className="mt-1 text-white/70">{formatDate(order.createdAt)}</p>
        {LIVE_STATUSES.includes(order.status) && (
          <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-green-500/20 px-3 py-1 text-xs font-semibold text-green-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
            Comandă live
          </span>
        )}
        <span
          className={`mt-2 inline-block rounded-lg px-2 py-1 text-sm font-semibold ${
            order.status === "DELIVERED"
              ? "bg-green-500/20 text-green-300"
              : order.status === "CANCELLED" || order.status === "CANCELED"
                ? "bg-red-500/20 text-red-300"
                : "bg-amber-500/20 text-amber-300"
          }`}
        >
          {STATUS_LABEL[order.status] ?? order.status}
        </span>

        <OrderStatusTimeline status={order.status} />

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

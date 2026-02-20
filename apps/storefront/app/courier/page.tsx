"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useAuthReady } from "@/hooks/useAuthReady";
import { useCourierAvailableStream } from "@/lib/useCourierAvailableStream";
import { api, type Order } from "@/lib/api";
import { playNewOrderSound } from "@/lib/courierNotificationSound";
import BottomNavigation from "@/components/ui/BottomNavigation";
import Toast from "@/components/ui/Toast";

type Tab = "available" | "mine" | "history" | "refused";

type OrderWithRefused = Order & { statusDisplay?: string; rejectedAt?: string; refusedReason?: string | null };

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("ro-RO", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getPaymentMethodLabel(pm: string | undefined): string {
  if (pm === "CARD") return "Plată cu cardul";
  return "Plată la livrare";
}

function OrderCard({
  order,
  onAccept,
  onRefuse,
  showActions,
  onStatusChange,
}: {
  order: Order | OrderWithRefused;
  onAccept?: (id: string) => void;
  onRefuse?: (id: string, reason?: string) => void;
  showActions?: boolean;
  onStatusChange?: (id: string, status: "ON_THE_WAY" | "DELIVERED") => void;
}) {
  const [refusing, setRefusing] = useState(false);
  const [refuseReason, setRefuseReason] = useState("");
  const itemsCount = (order?.items ?? []).reduce((s, i) => s + (Number(i?.quantity) || 0), 0);
  const total = Number(order?.total ?? 0).toFixed(2);
  const orderId = order?.id ?? '';
  const isRefused = (order as OrderWithRefused).statusDisplay === "REFUSED";
  const statusLabel = isRefused ? "Refuzată" : (order?.status ?? "");

  return (
    <div className="rounded-xl border border-white/20 bg-white/5 p-4">
      <Link
        href={orderId ? `/courier/orders/${orderId}` : '#'}
        className="block hover:opacity-90"
        onClick={(e) => !orderId && e.preventDefault()}
      >
        <div className="flex justify-between items-start">
          <span className="text-xs text-white/50 font-mono">
            #{String(orderId).slice(0, 8)}
          </span>
          <span className="text-xs text-white/60">{formatDate(order?.createdAt ?? '')}</span>
        </div>
        <p className="mt-2 text-xs text-white/50 uppercase tracking-wide">Adresă livrare</p>
        <p className="mt-0.5 text-white font-medium line-clamp-2">
          {order.deliveryAddress || "—"}
        </p>
        {(order.name || order.phone) && (
          <p className="mt-1.5 text-sm text-white/70">
            {order.name || ""}{order.name && order.phone ? " · " : ""}{order.phone || ""}
          </p>
        )}
        <p className="mt-1 text-sm text-white/70">
          {itemsCount} produse · {total} lei
        </p>
        <p className="mt-1.5 text-sm font-medium text-green-400">
          {getPaymentMethodLabel(order?.paymentMethod)}
        </p>
        {(statusLabel || isRefused) && (
          <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded ${isRefused ? "bg-red-500/20 text-red-300" : "bg-white/10 text-white/80"}`}>
            {statusLabel}
          </span>
        )}
        {isRefused && (order as OrderWithRefused).refusedReason && (
          <p className="mt-1.5 text-xs text-white/50 italic">{(order as OrderWithRefused).refusedReason}</p>
        )}
      </Link>
      {showActions && onAccept && onRefuse && (
        <div className="mt-4 flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => onAccept(orderId)}
            className="rounded-lg bg-green-500/80 px-3 py-2 text-sm font-medium text-black hover:bg-green-500"
          >
            Accept
          </button>
          {!refusing ? (
            <button
              type="button"
              onClick={() => setRefusing(true)}
              className="rounded-lg border border-red-500/60 px-3 py-2 text-sm font-medium text-red-300 hover:bg-red-500/20"
            >
              Refuză
            </button>
          ) : (
            <div className="flex gap-2 flex-1 min-w-0">
              <input
                type="text"
                value={refuseReason}
                onChange={(e) => setRefuseReason(e.target.value)}
                placeholder="Motiv (opțional)"
                className="flex-1 min-w-0 rounded border border-white/20 bg-white/10 px-2 py-1.5 text-sm text-white placeholder:text-white/40"
              />
              <button
                type="button"
                onClick={() => {
                  onRefuse(orderId, refuseReason || undefined);
                  setRefusing(false);
                  setRefuseReason("");
                }}
                className="rounded bg-red-500/80 px-2 py-1.5 text-sm text-white"
              >
                Confirm
              </button>
            </div>
          )}
        </div>
      )}
      {showActions && onStatusChange && order?.status === "ACCEPTED" && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => onStatusChange(orderId, "ON_THE_WAY")}
            className="w-full rounded-lg bg-amber-500/80 px-3 py-2 text-sm font-medium text-black hover:bg-amber-500"
          >
            Start delivery (Pe drum)
          </button>
        </div>
      )}
      {showActions && onStatusChange && order?.status === "ON_THE_WAY" && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => onStatusChange(orderId, "DELIVERED")}
            className="w-full rounded-lg bg-green-500/80 px-3 py-2 text-sm font-medium text-black hover:bg-green-500"
          >
            Marchează livrat
          </button>
        </div>
      )}
    </div>
  );
}

export default function CourierDashboardPage() {
  const router = useRouter();
  const authReady = useAuthReady();
  const { isAuthenticated, user, token } = useAuthStore();
  const [tab, setTab] = useState<Tab>("available");
  const [available, setAvailable] = useState<Order[]>([]);
  const [mine, setMine] = useState<Order[]>([]);
  const [history, setHistory] = useState<Order[]>([]);
  const [refused, setRefused] = useState<OrderWithRefused[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [newOrderToast, setNewOrderToast] = useState<string | null>(null);
  const prevAvailableIdsRef = useRef<Set<string>>(new Set());
  const newOrderToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canAccess =
    isAuthenticated &&
    user &&
    (user.role === "COURIER" || user.role === "ADMIN");

  const fetchAll = useCallback(async (opts?: { silent?: boolean }) => {
    if (!canAccess) return;
    const silent = opts?.silent === true;
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const [avRes, mineRes, histRes, refusedRes] = await Promise.all([
        api.courier.getAvailable(),
        api.courier.getMine(),
        api.courier.getHistory(),
        api.courier.getRefused(),
      ]);
      const avList = Array.isArray(avRes?.data?.orders) ? avRes.data.orders : [];
      setAvailable(avList);
      prevAvailableIdsRef.current = new Set(avList.map((o) => o.id));
      setMine(Array.isArray(mineRes?.data?.orders) ? mineRes.data.orders : []);
      setHistory(Array.isArray(histRes?.data?.orders) ? histRes.data.orders : []);
      setRefused(Array.isArray(refusedRes?.data?.orders) ? (refusedRes.data.orders as OrderWithRefused[]) : []);
    } catch (err: unknown) {
      if (silent) return;
      const status = (err as { response?: { status: number; data?: { error?: string } } })?.response?.status;
      const apiError = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      if (status === 429) {
        setError(typeof apiError === 'string' ? apiError : "Prea multe cereri. Încearcă din nou mai târziu.");
        return;
      }
      if (status === 401) {
        setError("Sesiune expirată. Te rugăm să te reconectezi.");
        return;
      }
      if (status === 403) {
        router.replace("/");
        return;
      }
      setError("Nu s-au putut încărca comenzile. Încearcă din nou.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [canAccess, router]);

  const fetchAvailableOnly = useCallback(async () => {
    if (!canAccess) return;
    try {
      const avRes = await api.courier.getAvailable();
      const newList = Array.isArray(avRes?.data?.orders) ? avRes.data.orders : [];
      const prevIds = prevAvailableIdsRef.current;
      const newIds = newList.filter((o) => !prevIds.has(o.id)).map((o) => o.id);
      setAvailable(newList);
      prevAvailableIdsRef.current = new Set(newList.map((o) => o.id));
      if (prevIds.size > 0 && newIds.length > 0) {
        playNewOrderSound();
        const msg = newIds.length === 1 ? "Comandă nouă disponibilă!" : `${newIds.length} comenzi noi disponibile!`;
        setNewOrderToast(msg);
        if (newOrderToastTimerRef.current) clearTimeout(newOrderToastTimerRef.current);
        newOrderToastTimerRef.current = setTimeout(() => {
          setNewOrderToast(null);
          newOrderToastTimerRef.current = null;
        }, 5000);
      }
    } catch (_) {
      // La polling nu afișăm eroare; fetchAll o va face la încărcarea inițială
    }
  }, [canAccess]);

  const streamEnabled = tab === "available" && !!canAccess && !!token;
  const { connected: streamConnected } = useCourierAvailableStream(
    token ?? null,
    streamEnabled,
    fetchAvailableOnly
  );

  useEffect(() => {
    if (newOrderToastTimerRef.current) clearTimeout(newOrderToastTimerRef.current);
    return () => {
      if (newOrderToastTimerRef.current) clearTimeout(newOrderToastTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!authReady) return;
    if (!isAuthenticated || !user) {
      const token = typeof window !== "undefined" ? localStorage.getItem("jester_token") : null;
      if (token) return;
      router.replace("/login?next=" + encodeURIComponent("/courier"));
      return;
    }
    if (!canAccess) {
      router.replace("/");
      return;
    }
    fetchAll();
  }, [authReady, isAuthenticated, user, canAccess, router, fetchAll]);

  useEffect(() => {
    if (!canAccess || tab !== "available") return;
    fetchAvailableOnly();
    if (streamConnected) return;
    const interval = setInterval(fetchAvailableOnly, 8000);
    const onVisibility = () => {
      if (document.visibilityState === "visible") fetchAvailableOnly();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [canAccess, tab, fetchAvailableOnly, streamConnected]);

  const handleAccept = async (id: string) => {
    setActionId(id);
    setError(null);
    const orderFromList = available.find((o) => o.id === id);
    if (orderFromList) {
      setAvailable((prev) => prev.filter((o) => o.id !== id));
      setMine((prev) => [{ ...orderFromList, status: "ACCEPTED", assignedCourierId: user?.id ?? null }, ...prev]);
    }
    try {
      await api.courier.accept(id);
      fetchAll({ silent: true });
    } catch (err: unknown) {
      if (orderFromList) {
        setAvailable((prev) => [...prev, orderFromList].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
        setMine((prev) => prev.filter((o) => o.id !== id));
      }
      const res = (err as { response?: { data?: { error?: string; code?: string }; status?: number } })?.response;
      const msg =
        res?.status === 409 && res?.data?.code === "ORDER_ALREADY_TAKEN"
          ? "Comanda a fost deja acceptată de un alt curier."
          : (res?.data?.error as string) || "Eroare la acceptare.";
      setError(msg);
    } finally {
      setActionId(null);
    }
  };

  const handleRefuse = async (id: string, reason?: string) => {
    setActionId(id);
    setError(null);
    const orderFromList = available.find((o) => o.id === id);
    if (orderFromList) {
      setAvailable((prev) => prev.filter((o) => o.id !== id));
      const refusedOrder: OrderWithRefused = {
        ...orderFromList,
        statusDisplay: "REFUSED",
        refusedReason: reason ?? null,
        rejectedAt: new Date().toISOString(),
      };
      setRefused((prev) => [refusedOrder, ...prev]);
    }
    try {
      await api.courier.refuse(id, reason);
      const refetch = () => fetchAll({ silent: true });
      try {
        await refetch();
      } catch {
        setTimeout(refetch, 2000);
      }
      setNewOrderToast("Comandă refuzată.");
      if (newOrderToastTimerRef.current) clearTimeout(newOrderToastTimerRef.current);
      newOrderToastTimerRef.current = setTimeout(() => {
        setNewOrderToast(null);
        newOrderToastTimerRef.current = null;
      }, 4000);
    } catch (err: unknown) {
      if (orderFromList) {
        setAvailable((prev) => [...prev, orderFromList].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
        setRefused((prev) => prev.filter((o) => o.id !== id));
      }
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Eroare la refuz.";
      setError(msg);
    } finally {
      setActionId(null);
    }
  };

  const handleStatusChange = async (
    id: string,
    status: "ON_THE_WAY" | "DELIVERED"
  ) => {
    setActionId(id);
    setError(null);
    const prevMine = mine;
    setMine((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    try {
      await api.courier.setStatus(id, status);
      fetchAll({ silent: true });
    } catch (err: unknown) {
      setMine(prevMine);
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Eroare la actualizare status.";
      setError(msg);
    } finally {
      setActionId(null);
    }
  };

  if (!authReady || (!isAuthenticated && typeof window !== "undefined" && localStorage.getItem("jester_token"))) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#050610] via-[#040411] to-[#050610] flex items-center justify-center text-white">
        <p>Se încarcă...</p>
      </main>
    );
  }
  if (!isAuthenticated || !user) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#050610] via-[#040411] to-[#050610] flex items-center justify-center text-white">
        <p>Se redirecționează la login...</p>
      </main>
    );
  }

  if (!canAccess) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#050610] via-[#040411] to-[#050610] flex items-center justify-center text-white">
        <p>Nu ai acces la dashboard-ul de curier.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#050610] via-[#040411] to-[#050610] pb-24 pt-8 text-white">
      <div className="mx-auto max-w-2xl px-4">
        <div className="mb-6 flex items-center gap-4">
          <Link
            href="/"
            className="text-sm text-white/70 underline hover:text-white"
          >
            ← Acasă
          </Link>
          <span className="text-white/50">|</span>
          <span className="text-sm text-amber-400 font-medium">Dashboard Curier</span>
        </div>
        <h1 className="text-2xl font-bold">Courier Dashboard</h1>
        <p className="mt-1 text-sm text-white/60">
          Comenzi disponibile, livrările tale, istoric
        </p>

        <div className="mt-6 flex border-b border-white/20 overflow-x-auto">
          {(
            [
              { id: "available" as Tab, label: "Disponibile" },
              { id: "mine" as Tab, label: "Livrările mele" },
              { id: "refused" as Tab, label: "Refuzate" },
              { id: "history" as Tab, label: "Istoric" },
            ] as const
          ).map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition ${
                tab === id
                  ? "border-amber-500 text-amber-400"
                  : "border-transparent text-white/60 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-sm">
            <p>{error}</p>
            {error.includes("Sesiune expirată") ? (
              <Link href="/login?next=%2Fcourier" className="mt-2 inline-block text-amber-300 underline">
                Reconectează-te
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => { setError(null); fetchAll(); }}
                className="mt-2 rounded-lg bg-white/15 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/25"
              >
                Reîncearcă
              </button>
            )}
          </div>
        )}

        <Toast
          message={newOrderToast}
          onDismiss={() => {
            setNewOrderToast(null);
            if (newOrderToastTimerRef.current) {
              clearTimeout(newOrderToastTimerRef.current);
              newOrderToastTimerRef.current = null;
            }
          }}
        />

        {loading && (
          <p className="mt-6 text-white/70">Se încarcă...</p>
        )}

        {!loading && tab === "available" && (
          <div className="mt-6 space-y-4">
            {available.length === 0 ? (
              <p className="text-white/60">Nicio comandă disponibilă.</p>
            ) : (
              available.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  showActions={true}
                  onAccept={handleAccept}
                  onRefuse={handleRefuse}
                />
              ))
            )}
          </div>
        )}

        {!loading && tab === "mine" && (
          <div className="mt-6 space-y-4">
            {mine.length === 0 ? (
              <p className="text-white/60">Nicio livrare în curs.</p>
            ) : (
              mine.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  showActions={true}
                  onStatusChange={handleStatusChange}
                />
              ))
            )}
          </div>
        )}

        {!loading && tab === "refused" && (
          <div className="mt-6 space-y-4">
            {refused.length === 0 ? (
              <p className="text-white/60">Nicio comandă refuzată.</p>
            ) : (
              refused.map((order) => (
                <OrderCard key={order.id} order={order} showActions={false} />
              ))
            )}
          </div>
        )}

        {!loading && tab === "history" && (
          <div className="mt-6 space-y-4">
            {history.length === 0 ? (
              <p className="text-white/60">Niciun istoric.</p>
            ) : (
              history.map((order) => (
                <OrderCard key={order.id} order={order} showActions={false} />
              ))
            )}
          </div>
        )}
      </div>
      <BottomNavigation />
    </main>
  );
}

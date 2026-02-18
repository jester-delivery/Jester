"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, type Order } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { useAuthReady } from "@/hooks/useAuthReady";

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
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Jester2424AdminPage() {
  const router = useRouter();
  const authReady = useAuthReady();
  const { isAuthenticated, user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [etaInputs, setEtaInputs] = useState<Record<string, string>>({});
  const [notesInputs, setNotesInputs] = useState<Record<string, string>>({});

  const fetchOrders = useCallback(async () => {
    try {
      const res = await api.admin.getOrders();
      const list = res.data.orders ?? [];
      setOrders(
        [...list].sort((a, b) => {
          const statusOrder = (s: string) =>
            s === "PENDING" ? 0 : s === "CONFIRMED" ? 1 : s === "PREPARING" ? 2 : 3;
          return statusOrder(a.status) - statusOrder(b.status);
        })
      );
      setError(null);
    } catch (err: any) {
      if (err.response?.status === 403) {
        router.replace("/");
        return;
      }
      setError("Nu s-au putut încărca comenzile.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleStatus = async (orderId: string, status: string) => {
    setUpdatingId(orderId);
    try {
      await api.orders.updateStatus(orderId, { status });
      await fetchOrders();
    } catch {
      setError("Eroare la actualizare status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSetEta = async (orderId: string) => {
    const v = etaInputs[orderId];
    const mins = v ? parseInt(v, 10) : null;
    if (mins != null && (isNaN(mins) || mins < 0 || mins > 180)) return;
    setUpdatingId(orderId);
    try {
      await api.orders.updateStatus(orderId, { estimatedDeliveryMinutes: mins ?? undefined });
      setEtaInputs((prev) => ({ ...prev, [orderId]: "" }));
      await fetchOrders();
    } catch {
      setError("Eroare la setare ETA.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSetNotes = async (orderId: string, currentNotes: string) => {
    const v = currentNotes.trim();
    setUpdatingId(orderId);
    try {
      await api.orders.updateStatus(orderId, { internalNotes: v || undefined });
      setNotesInputs((prev) => ({ ...prev, [orderId]: "" }));
      await fetchOrders();
    } catch {
      setError("Eroare la setare note.");
    } finally {
      setUpdatingId(null);
    }
  };

  useEffect(() => {
    if (!authReady) return;
    if (!isAuthenticated || !user) {
      const token = typeof window !== "undefined" ? localStorage.getItem("jester_token") : null;
      if (token) return;
      router.replace("/login?next=" + encodeURIComponent("/jester-24-24/admin"));
      return;
    }
    fetchOrders();
    const interval = setInterval(fetchOrders, 8000);
    return () => clearInterval(interval);
  }, [authReady, isAuthenticated, user, router, fetchOrders]);

  if (!authReady || (!isAuthenticated && typeof window !== "undefined" && localStorage.getItem("jester_token"))) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#050610] via-[#040411] to-[#050610] text-white">
        <p className="text-white/70">Se încarcă...</p>
      </main>
    );
  }
  if (!isAuthenticated || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#050610] via-[#040411] to-[#050610] text-white">
        <p className="text-white/70">Se redirecționează la login...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#050610] via-[#040411] to-[#050610] pb-12 pt-8 text-white">
      <div className="mx-auto max-w-4xl px-4">
        <div className="mb-6 flex items-center gap-4">
          <Link
            href="/jester-24-24"
            className="text-sm text-white/70 underline hover:text-white"
          >
            ← Jester 24/24
          </Link>
          <Link
            href="/jester-24-24/admin/products"
            className="text-sm text-amber-400 underline hover:text-amber-300"
          >
            Produse
          </Link>
        </div>
        <h1 className="text-2xl font-bold sm:text-3xl">Comenzi (admin)</h1>
        <p className="mt-1 text-sm text-white/60">
          Operează statusul comenzilor
        </p>

        {loading && (
          <p className="mt-6 text-white/70">Se încarcă...</p>
        )}

        {error && (
          <p className="mt-6 text-red-300">{error}</p>
        )}

        {!loading && !error && orders.length === 0 && (
          <p className="mt-6 text-white/70">Nicio comandă încă.</p>
        )}

        {!loading && !error && orders.length > 0 && (
          <ul className="mt-6 space-y-4">
            {orders.map((order) => (
              <li
                key={order.id}
                className="rounded-2xl border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <span className="text-xs font-mono text-white/60">
                    #{order.id.slice(0, 8)}
                  </span>
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
                <ul className="mt-3 space-y-2">
                  {order.items.map((item) => (
                    <li
                      key={item.id}
                      className="flex justify-between text-sm"
                    >
                      <span className="text-white">
                        {item.name} × {item.quantity}
                      </span>
                      <span className="text-white/70">
                        {(Number(item.price) * item.quantity).toFixed(2)} lei
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3">
                  <span className="text-sm text-white/60">
                    Plată: {order.paymentMethod === "CARD" ? "Card" : "La livrare"}
                  </span>
                  <span className="text-lg font-bold">
                    Total: {Number(order.total).toFixed(2)} lei
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 items-center">
                  <span className="text-sm text-white/60">ETA:</span>
                  {order.estimatedDeliveryMinutes != null && (
                    <span className="text-sm text-amber-400/90">~{order.estimatedDeliveryMinutes} min</span>
                  )}
                  <input
                    type="number"
                    min={0}
                    max={180}
                    placeholder="min"
                    value={etaInputs[order.id] ?? ""}
                    onChange={(e) => setEtaInputs((prev) => ({ ...prev, [order.id]: e.target.value }))}
                    className="w-16 rounded bg-white/10 px-2 py-1 text-sm text-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleSetEta(order.id)}
                    disabled={updatingId === order.id}
                    className="rounded bg-white/10 px-2 py-1 text-xs text-white hover:bg-white/20 disabled:opacity-50"
                  >
                    Set
                  </button>
                </div>
                <div className="mt-1 flex gap-2 items-start">
                  <input
                    type="text"
                    placeholder="Note interne (ex: lipsă produs)"
                    value={notesInputs[order.id] ?? order.internalNotes ?? ""}
                    onChange={(e) => setNotesInputs((prev) => ({ ...prev, [order.id]: e.target.value }))}
                    className="flex-1 min-w-0 rounded bg-white/10 px-2 py-1 text-sm text-white placeholder:text-white/50"
                  />
                  <button
                    type="button"
                    onClick={() => handleSetNotes(order.id, notesInputs[order.id] ?? (order as { internalNotes?: string }).internalNotes ?? "")}
                    disabled={updatingId === order.id}
                    className="shrink-0 rounded bg-white/10 px-2 py-1 text-xs text-white hover:bg-white/20 disabled:opacity-50"
                  >
                    Salvează
                  </button>
                </div>
                {order.status !== "DELIVERED" && order.status !== "CANCELLED" && order.status !== "CANCELED" && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {order.status === "PENDING" && (
                      <button
                        onClick={() => handleStatus(order.id, "CONFIRMED")}
                        disabled={updatingId === order.id}
                        className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-black transition hover:bg-amber-400 disabled:opacity-50"
                      >
                        Confirm
                      </button>
                    )}
                    {(order.status === "PENDING" || order.status === "CONFIRMED") && (
                      <button
                        onClick={() => handleStatus(order.id, "PREPARING")}
                        disabled={updatingId === order.id}
                        className="rounded-lg bg-amber-500/80 px-3 py-1.5 text-sm font-semibold text-black transition hover:bg-amber-500 disabled:opacity-50"
                      >
                        Preparing
                      </button>
                    )}
                    {(order.status === "CONFIRMED" || order.status === "PREPARING") && (
                      <button
                        onClick={() => handleStatus(order.id, "ON_THE_WAY")}
                        disabled={updatingId === order.id}
                        className="rounded-lg bg-blue-500/80 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
                      >
                        On the way
                      </button>
                    )}
                    {(order.status === "PREPARING" || order.status === "ON_THE_WAY" || order.status === "OUT_FOR_DELIVERY") && (
                      <button
                        onClick={() => handleStatus(order.id, "DELIVERED")}
                        disabled={updatingId === order.id}
                        className="rounded-lg bg-green-500/80 px-3 py-1.5 text-sm font-semibold text-black transition hover:bg-green-500 disabled:opacity-50"
                      >
                        Delivered
                      </button>
                    )}
                    {(order.status === "PENDING" || order.status === "CONFIRMED") && (
                      <button
                        onClick={() => handleStatus(order.id, "CANCELED")}
                        disabled={updatingId === order.id}
                        className="rounded-lg bg-red-500/80 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useAuthReady } from "@/hooks/useAuthReady";
import { api, type Order } from "@/lib/api";
import BottomNavigation from "@/components/ui/BottomNavigation";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ro-RO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CourierOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string | undefined;
  const authReady = useAuthReady();
  const { isAuthenticated, user } = useAuthStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refuseReason, setRefuseReason] = useState("");
  const [showRefuse, setShowRefuse] = useState(false);
  const [actioning, setActioning] = useState(false);

  const canAccess =
    isAuthenticated &&
    user &&
    (user.role === "COURIER" || user.role === "ADMIN");

  useEffect(() => {
    if (!authReady) return;
    if (!isAuthenticated || !user) {
      const token = typeof window !== "undefined" ? localStorage.getItem("jester_token") : null;
      if (token) return;
      router.replace("/login?next=" + encodeURIComponent("/courier"));
      return;
    }
    if (!canAccess || !id) {
      if (!canAccess) router.replace("/");
      return;
    }
    let cancelled = false;
    api.courier
      .getOrder(id)
      .then((res) => {
        if (!cancelled) setOrder(res.data.order);
      })
      .catch((err) => {
        if (!cancelled) {
          const status = err?.response?.status;
          if (status === 401) setError("Sesiune expirată. Te rugăm să te reconectezi.");
          else if (status === 403) router.replace("/courier");
          else setError("Comandă negăsită sau fără acces.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authReady, isAuthenticated, user, canAccess, id, router]);

  const isRefusedByMe = !!(order && (order as { refusedByMe?: boolean }).refusedByMe);
  const isAvailable =
    !!order && order.status === "PENDING" && !order.assignedCourierId && !isRefusedByMe;
  const isMine = order?.assignedCourierId === user?.id;
  const orderIdSafe = order?.id ?? "";

  const handleAccept = async () => {
    if (!order?.id) return;
    setActioning(true);
    setError(null);
    try {
      await api.courier.accept(order.id);
      router.push("/courier");
    } catch (err: unknown) {
      const res = (err as { response?: { data?: { error?: string; code?: string }; status?: number } })?.response;
      const msg =
        res?.status === 409 && res?.data?.code === "ORDER_ALREADY_TAKEN"
          ? "Comanda a fost deja acceptată de un alt curier."
          : (res?.data?.error as string) || "Eroare la acceptare.";
      setError(msg);
    } finally {
      setActioning(false);
    }
  };

  const handleRefuse = async () => {
    if (!order?.id) return;
    setActioning(true);
    setError(null);
    try {
      await api.courier.refuse(order.id, refuseReason || undefined);
      router.push("/courier");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Eroare la refuz.";
      setError(msg);
    } finally {
      setActioning(false);
    }
  };

  const handleStatus = async (status: "ON_THE_WAY" | "DELIVERED") => {
    if (!order?.id) return;
    setActioning(true);
    setError(null);
    try {
      await api.courier.setStatus(order.id, status);
      setOrder((prev) => (prev ? { ...prev, status } : null));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Eroare la actualizare status.";
      setError(msg);
    } finally {
      setActioning(false);
    }
  };

  if (!authReady || (!isAuthenticated && typeof window !== "undefined" && localStorage.getItem("jester_token"))) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#050610] via-[#040411] to-[#050610] flex items-center justify-center text-white">
        <p>Se încarcă...</p>
      </main>
    );
  }
  if (!isAuthenticated || !user || !canAccess) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#050610] via-[#040411] to-[#050610] flex items-center justify-center text-white">
        <p>Se redirecționează...</p>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#050610] via-[#040411] to-[#050610] flex items-center justify-center text-white">
        <p>Se încarcă...</p>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#050610] via-[#040411] to-[#050610] px-4 pt-8 text-white">
        <Link href="/courier" className="text-sm text-white/70 underline">
          ← Înapoi la dashboard
        </Link>
        <p className="mt-6 text-red-300">{error || "Comandă negăsită."}</p>
      </main>
    );
  }

  const total = Number(order.total ?? 0).toFixed(2);

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#050610] via-[#040411] to-[#050610] pb-24 pt-8 text-white">
      <div className="mx-auto max-w-2xl px-4">
        <Link
          href="/courier"
          className="text-sm text-white/70 underline hover:text-white"
        >
          ← Înapoi la dashboard
        </Link>
        <p className="mt-2 text-xs text-amber-400/80 font-medium">Adresă livrare și detalii comandă</p>

        <div className="mt-6 rounded-xl border border-white/20 bg-white/5 p-4">
          <div className="flex justify-between items-start">
            <span className="text-xs text-white/50 font-mono">
              #{order.id.slice(0, 8)}
            </span>
            <span className="text-xs text-white/60">{formatDate(order.createdAt)}</span>
          </div>
          <p className="mt-2 text-xs text-white/50">Status</p>
          <p className={`font-medium ${(order as { statusDisplay?: string }).statusDisplay === "REFUSED" ? "text-red-300" : "text-amber-400"}`}>
            {(order as { statusDisplay?: string }).statusDisplay === "REFUSED" ? "Refuzată" : order.status}
          </p>
          {(order as { refusedReason?: string | null }).refusedReason && (
            <p className="mt-1 text-sm text-white/60 italic">{(order as { refusedReason?: string | null }).refusedReason}</p>
          )}

          <p className="mt-4 text-xs text-white/50">Adresă livrare</p>
          <p className="mt-1 text-white">{order.deliveryAddress || "—"}</p>

          {(order.name || order.phone) && (
            <>
              <p className="mt-4 text-xs text-white/50">Client</p>
              <p className="mt-1 text-white">
                {order.name || "—"}
                {order.phone ? ` · ${order.phone}` : ""}
              </p>
            </>
          )}

          <p className="mt-4 text-xs text-white/50">Produse</p>
          <ul className="mt-2 space-y-2">
            {(Array.isArray(order?.items) ? order.items : []).map((item, idx) => (
              <li
                key={(item as { id?: string })?.id ?? idx}
                className="flex justify-between text-sm text-white/90"
              >
                <span>
                  {item.name} × {item.quantity ?? 0}
                </span>
                <span>
                  {(Number(item.price ?? 0) * (item.quantity ?? 0)).toFixed(2)} lei
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4 pt-4 border-t border-white/10 flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>{total} lei</span>
          </div>

          {order.notes && (
            <>
              <p className="mt-4 text-xs text-white/50">Notițe</p>
              <p className="mt-1 text-white/80">{order.notes}</p>
            </>
          )}
        </div>

        {error && (
          <p className="mt-4 p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-sm">
            {error}
          </p>
        )}

        {isAvailable && (
          <div className="mt-6 space-y-3">
            <button
              type="button"
              disabled={actioning}
              onClick={handleAccept}
              className="w-full rounded-xl bg-green-500/80 py-3 font-semibold text-black hover:bg-green-500 disabled:opacity-50"
            >
              {actioning ? "Se procesează..." : "Accept comanda"}
            </button>
            {!showRefuse ? (
              <button
                type="button"
                onClick={() => setShowRefuse(true)}
                className="w-full rounded-xl border border-red-500/60 py-3 font-medium text-red-300 hover:bg-red-500/20"
              >
                Refuz
              </button>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={refuseReason}
                  onChange={(e) => setRefuseReason(e.target.value)}
                  placeholder="Motiv refuz (opțional)"
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/40"
                />
                <button
                  type="button"
                  disabled={actioning}
                  onClick={handleRefuse}
                  className="w-full rounded-xl bg-red-500/80 py-3 font-medium text-white hover:bg-red-500 disabled:opacity-50"
                >
                  Confirm refuz
                </button>
              </div>
            )}
          </div>
        )}

        {isMine && order.status === "ACCEPTED" && (
          <div className="mt-6">
            <button
              type="button"
              disabled={actioning}
              onClick={() => handleStatus("ON_THE_WAY")}
              className="w-full rounded-xl bg-amber-500/80 py-3 font-semibold text-black hover:bg-amber-500 disabled:opacity-50"
            >
              Start delivery (Pe drum)
            </button>
          </div>
        )}

        {isMine && order.status === "ON_THE_WAY" && (
          <div className="mt-6">
            <button
              type="button"
              disabled={actioning}
              onClick={() => handleStatus("DELIVERED")}
              className="w-full rounded-xl bg-green-500/80 py-3 font-semibold text-black hover:bg-green-500 disabled:opacity-50"
            >
              Marchează livrat
            </button>
          </div>
        )}
      </div>
      <BottomNavigation />
    </main>
  );
}

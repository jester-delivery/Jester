"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import BottomNavigation from "@/components/ui/BottomNavigation";
import { api, type Order } from "@/lib/api";
import { getActiveOrdersCount, getOrderStatusClass, ORDER_STATUS_LABEL } from "@/lib/orderStatus";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ro-RO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function NotificationsContent() {
  const { user, isLoading } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = () => {
    if (!user) return;
    api.orders
      .getMy()
      .then((res) => setOrders(res.data.orders ?? []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetchOrders();
  }, [user]);

  // Re-fetch când revii pe tab (același pattern ca pe Orders list)
  useEffect(() => {
    if (!user) return;
    const onVisibility = () => {
      if (document.visibilityState === "visible") fetchOrders();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [user]);

  const activeCount = getActiveOrdersCount(orders);

  if (isLoading || !user) {
    return (
      <main className="min-h-screen text-white bg-gradient-to-b from-[#050610] via-[#040411] to-[#050610] pb-24 flex items-center justify-center">
        <p className="text-white/70">Se încarcă...</p>
        <BottomNavigation />
      </main>
    );
  }

  return (
    <main className="min-h-screen text-white bg-gradient-to-b from-[#050610] via-[#040411] to-[#050610] pb-24">
      <div className="container mx-auto px-4 py-8 max-w-lg">
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/profile"
            className="p-2 rounded-xl bg-white/10 border border-white/20 hover:bg-white/15 transition"
            aria-label="Înapoi"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-semibold">Notificări</h1>
            <p className="text-white/60 text-sm">Status comenzi</p>
          </div>
          <span className="flex h-8 min-w-[2rem] items-center justify-center rounded-full bg-amber-500/80 px-2 text-xs font-semibold text-black">
            {activeCount > 99 ? "99+" : activeCount}
          </span>
        </div>

        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-2xl bg-white/10" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl border border-white/20 bg-white/10 p-8 text-center">
            <p className="text-white/80 font-medium">Nicio comandă</p>
            <p className="mt-1 text-sm text-white/60">Comenzile tale vor apărea aici.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/orders/${order.id}`}
                  className="block rounded-2xl border border-white/20 bg-white/10 p-4 hover:border-white/30 hover:bg-white/15 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-white">
                        Comandă #{order.id.slice(0, 8)}
                      </p>
                      <p className="mt-0.5 text-sm text-white/60">
                        {formatDate(order.createdAt)} · {Number(order.total).toFixed(2)} lei
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${getOrderStatusClass(order.status)}`}
                    >
                      {ORDER_STATUS_LABEL[order.status] ?? order.status}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      <BottomNavigation />
    </main>
  );
}

export default function NotificationsPage() {
  return (
    <ProtectedRoute>
      <NotificationsContent />
    </ProtectedRoute>
  );
}

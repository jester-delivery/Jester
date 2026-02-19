"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import BottomNavigation from "@/components/ui/BottomNavigation";
import { api } from "@/lib/api";
import { isFinalOrderStatus } from "@/lib/orderStatus";
import { getSeenOrderIds, clearSeenForFinalOrders } from "@/lib/notificationSeen";

function ProfilePageContent() {
  const router = useRouter();
  const { user, isLoading, fetchUser, logout } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    if (!user) fetchUser();
  }, [user, fetchUser]);

  const fetchOrdersForBadge = useCallback(() => {
    if (!user) return;
    api.orders
      .getMy()
      .then((res) => {
        const orders = res.data.orders ?? [];
        const finalIds = orders.filter((o) => isFinalOrderStatus(o.status)).map((o) => o.id);
        if (finalIds.length) clearSeenForFinalOrders(finalIds);
        const active = orders.filter((o) => !isFinalOrderStatus(o.status));
        const seen = getSeenOrderIds();
        setUnreadCount(active.filter((o) => !seen.includes(o.id)).length);
      })
      .catch(() => setUnreadCount(0));
  }, [user]);

  useEffect(() => {
    fetchOrdersForBadge();
  }, [fetchOrdersForBadge]);

  useEffect(() => {
    if (!user) return;
    const onVisibility = () => {
      if (document.visibilityState === "visible") fetchOrdersForBadge();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [user, fetchOrdersForBadge]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (isLoading) {
    return (
      <main className="min-h-screen text-white bg-gradient-to-b from-[#050610] via-[#040411] to-[#050610] pb-28">
        <div className="container mx-auto px-4 py-8 max-w-lg animate-pulse">
          <div className="text-center mb-10">
            <div className="w-20 h-20 rounded-full bg-white/15 mx-auto mb-4" />
            <div className="h-5 w-32 rounded bg-white/20 mx-auto mb-2" />
            <div className="h-4 w-48 rounded bg-white/10 mx-auto" />
          </div>
          <div className="space-y-4">
            <div className="h-16 rounded-2xl bg-white/10" />
            <div className="h-16 rounded-2xl bg-white/10" />
            <div className="h-16 rounded-2xl bg-white/10" />
          </div>
        </div>
        <BottomNavigation />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen text-white bg-gradient-to-b from-[#050610] via-[#040411] to-[#050610] pb-24 flex items-center justify-center">
        <p className="text-white/70">Se redirecționează la login...</p>
        <BottomNavigation />
      </main>
    );
  }

  const initial = (user.name || "?").charAt(0).toUpperCase();
  const isCourier = user.role === "COURIER" || user.role === "ADMIN";

  return (
    <main className="min-h-screen text-white bg-gradient-to-b from-[#050610] via-[#040411] to-[#050610] pb-28">
      <div className="container mx-auto px-4 py-8 max-w-lg">
        {/* Header: avatar + nume + email (read-only) */}
        <header className="text-center mb-10">
          <div className="w-20 h-20 rounded-full bg-white/15 border border-white/20 flex items-center justify-center text-3xl font-bold text-white mx-auto mb-4">
            {initial}
          </div>
          <h1 className="text-xl font-semibold text-white mb-1">{user.name}</h1>
          <p className="text-white/70 text-sm">{user.email}</p>
        </header>

        {/* Dashboard Curier – vizibil doar pentru curieri / admin */}
        {isCourier && (
          <section className="mb-4">
            <Link
              href="/courier"
              className="flex items-center gap-4 w-full p-4 rounded-2xl bg-amber-500/20 backdrop-blur-md border border-amber-500/40 hover:bg-amber-500/30 transition"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/30 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8 4-8-4m0 0l8-4 8 4m0-6v12" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <span className="font-semibold text-amber-200">Dashboard Curier</span>
                <p className="text-amber-200/80 text-sm">Acceptă livrări, marchează status, vezi comenzile tale</p>
              </div>
              <svg className="w-5 h-5 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </section>
        )}

        {/* Card: Orders – prima opțiune importantă */}
        <section className="mb-4">
          <Link
            href="/orders"
            className="flex items-center gap-4 w-full p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 transition"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <div className="flex-1 text-left">
              <span className="font-medium text-white">Istoric comenzi</span>
              <p className="text-white/60 text-sm">Vezi și urmărește comenzile tale</p>
            </div>
            <svg className="w-5 h-5 text-white/50 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </section>

        {/* Card: Account / Setări cont */}
        <section className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 overflow-hidden mb-4">
          <div className="px-4 py-3 border-b border-white/10">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-white/60">Cont</h2>
          </div>
          <Link
            href="/profile/edit"
            className="flex items-center gap-4 w-full p-4 hover:bg-white/5 transition border-b border-white/10"
          >
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="flex-1 text-left">
              <span className="font-medium text-white">Edit profile</span>
              <p className="text-white/60 text-sm">Nume, telefon</p>
            </div>
            <svg className="w-5 h-5 text-white/50 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          <Link
            href="/addresses"
            className="flex items-center gap-4 w-full p-4 hover:bg-white/5 transition"
          >
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="flex-1 text-left">
              <span className="font-medium text-white">Adrese salvate</span>
              <p className="text-white/60 text-sm">Livrare la adresa ta</p>
            </div>
            <svg className="w-5 h-5 text-white/50 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </section>

        {/* Card: Notifications (structură + badge placeholder) */}
        <section className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 overflow-hidden mb-4">
          <Link
            href="/notifications"
            className="flex items-center gap-4 w-full p-4 hover:bg-white/5 transition text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 relative">
              <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-amber-500/80 px-1 text-[10px] font-semibold text-black">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            </div>
            <div className="flex-1 text-left">
              <span className="font-medium text-white">Notificări</span>
              <p className="text-white/60 text-sm">Status comenzi, oferte</p>
              <p className="text-white/40 text-xs mt-0.5">Glisează spre stânga pentru a ascunde din listă</p>
            </div>
            <svg className="w-5 h-5 text-white/50 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </section>

        {/* Card: Help (placeholder) */}
        <section className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 overflow-hidden mb-4">
          <button
            type="button"
            className="flex items-center gap-4 w-full p-4 hover:bg-white/5 transition text-left opacity-80"
            disabled
          >
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1 text-left">
              <span className="font-medium text-white">Ajutor & Support</span>
              <p className="text-white/60 text-sm">În curând</p>
            </div>
          </button>
        </section>

        {/* Log out – danger, jos */}
        <section className="mt-6">
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-300 font-semibold hover:bg-red-500/25 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Deconectează-te
          </button>
        </section>
      </div>

      <BottomNavigation />
    </main>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfilePageContent />
    </ProtectedRoute>
  );
}

"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useAuthReady } from "@/hooks/useAuthReady";

type ProtectedRouteProps = {
  children: React.ReactNode;
};

const LoadingEl = (
  <div className="min-h-screen flex items-center justify-center text-white">
    <p>Se încarcă...</p>
  </div>
);

/**
 * Protejează rutele care necesită autentificare.
 * Nu redirecționează la login înainte de rehidratarea Zustand (refresh păstrează sesiunea).
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const authReady = useAuthReady();
  const { isAuthenticated, isLoading, fetchUser } = useAuthStore();

  useEffect(() => {
    if (!authReady) return;
    const token = localStorage.getItem("jester_token");
    if (!token) {
      const next = pathname && !pathname.startsWith("/login") ? pathname : "/";
      router.push("/login?next=" + encodeURIComponent(next));
      return;
    }
    if (!isAuthenticated && !isLoading) {
      fetchUser();
    }
  }, [authReady, isAuthenticated, isLoading, router, fetchUser, pathname]);

  if (!authReady) return LoadingEl;
  if (isLoading) return LoadingEl;
  if (!isAuthenticated) {
    const token = typeof window !== "undefined" ? localStorage.getItem("jester_token") : null;
    if (token) return LoadingEl;
    return null;
  }
  return <>{children}</>;
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";

type ProtectedRouteProps = {
  children: React.ReactNode;
};

/**
 * ProtectedRoute Component
 * 
 * Protejează rutele care necesită autentificare
 * Redirecționează către /login dacă utilizatorul nu este autentificat
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading, fetchUser } = useAuthStore();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('jester_token');
      
      if (!token) {
        router.push('/login');
        return;
      }

      // Dacă nu avem user în store, îl fetch-uim
      if (!isAuthenticated && !isLoading) {
        await fetchUser();
      }
    };

    checkAuth();
  }, [isAuthenticated, isLoading, router, fetchUser]);

  // Afișează loading în timp ce verifică autentificarea
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <p>Se încarcă...</p>
      </div>
    );
  }

  // Dacă nu este autentificat, nu afișa nimic (redirect se face în useEffect)
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/authStore";

/**
 * Returnează true când putem decide sigur dacă redirecționăm la login.
 * La refresh, Zustand persist rehidratează din localStorage după primul render;
 * dacă redirectăm imediat când !isAuthenticated, ieșim din cont înainte de rehidratare.
 * Acest hook așteaptă montarea pe client și un mic delay ca persist să aibă timp
 * să rehidrateze, apoi returnează ready. Paginile protejate nu trebuie să redirecteze
 * la login decât când authReady && !isAuthenticated && !token.
 */
export function useAuthReady(): boolean {
  const [ready, setReady] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isAuthenticated) {
      setReady(true);
      return;
    }
    const token = localStorage.getItem("jester_token");
    if (!token) {
      setReady(true);
      return;
    }
    const t = setTimeout(() => setReady(true), 120);
    return () => clearTimeout(t);
  }, [isAuthenticated]);

  return ready;
}


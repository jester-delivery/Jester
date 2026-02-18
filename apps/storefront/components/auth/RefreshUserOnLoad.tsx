"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/authStore";

/**
 * La montare: dacă există token în localStorage, reîmprospătează userul de pe server (GET /auth/me)
 * ca să avem mereu role actualizat (ex: COURIER) și tab-ul Curier să apară.
 */
export default function RefreshUserOnLoad() {
  const fetchUser = useAuthStore((s) => s.fetchUser);
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    const token =
      typeof window !== "undefined" ? localStorage.getItem("jester_token") : null;
    if (token) {
      done.current = true;
      fetchUser();
    }
  }, [fetchUser]);

  return null;
}

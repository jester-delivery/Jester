"use client";

import { useEffect, useRef } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

/**
 * Hook pentru SSE stream status comandă.
 * Se conectează la GET /orders/stream/:orderId cu auth header.
 * On status_changed → onStatusChange(status, order)
 */
export function useOrderStream(
  orderId: string | undefined,
  token: string | null,
  isLive: boolean,
  onStatusChange: (status: string, order: unknown) => void
) {
  const onStatusRef = useRef(onStatusChange);
  onStatusRef.current = onStatusChange;

  useEffect(() => {
    if (!orderId || !token || !isLive) return;

    const controller = new AbortController();

    const url = `${API_BASE}/orders/stream/${orderId}`;
    const headers: Record<string, string> = {
      Accept: "text/event-stream",
      Authorization: `Bearer ${token}`,
    };

    fetch(url, {
      headers,
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok || !res.body) return;
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const chunks = buffer.split("\n\n");
          buffer = chunks.pop() || "";

          for (const chunk of chunks) {
            let event = "";
            let data = "";
            for (const line of chunk.split("\n")) {
              if (line.startsWith("event: ")) event = line.slice(7).trim();
              if (line.startsWith("data: ")) data = line.slice(6);
            }
            if (event === "status_changed" && data) {
              try {
                const payload = JSON.parse(data);
                if (payload.status) onStatusRef.current(payload.status, payload.order);
              } catch (_) {}
            }
          }
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.warn("Order stream error:", err);
        }
      });

    return () => controller.abort();
  }, [orderId, token, isLive]);
}

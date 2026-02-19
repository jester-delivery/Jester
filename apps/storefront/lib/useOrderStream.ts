"use client";

import { useEffect, useRef } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const RECONNECT_DELAYS = [1000, 2000, 4000];
const MAX_RECONNECTS = 5;

/**
 * Hook pentru SSE stream status comandă.
 * Conectare la GET /orders/stream/:orderId; primește status_changed și heartbeat.
 * Reconnect cu backoff la deconectare (stream end / eroare).
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
    let reconnectCount = 0;
    let mounted = true;

    function connect() {
      if (!mounted || controller.signal.aborted) return;

      const url = `${API_BASE}/orders/stream/${orderId}`;
      const headers: Record<string, string> = {
        Accept: "text/event-stream",
        Authorization: `Bearer ${token}`,
      };

      fetch(url, { headers, signal: controller.signal })
        .then(async (res) => {
          if (!res.ok || !res.body || !mounted) return;
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          while (mounted && !controller.signal.aborted) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const chunks = buffer.split("\n\n");
            buffer = chunks.pop() || "";

            for (const chunk of chunks) {
              let event = "";
              const dataLines: string[] = [];
              for (const line of chunk.split("\n")) {
                if (line.startsWith("event: ")) event = line.slice(7).trim();
                if (line.startsWith("data: ")) dataLines.push(line.slice(6));
              }
              const data = dataLines.length > 0 ? dataLines.join("\n") : "";
              if (event === "status_changed" && data) {
                try {
                  const payload = JSON.parse(data) as { status?: string; order?: unknown; reason?: string };
                  // Notifică și când există doar reason (ex: courier_refused) ca să nu pierdem notificarea
                  if (payload && (payload.status !== undefined || payload.reason !== undefined)) {
                    onStatusRef.current(payload.status ?? "", payload);
                  }
                } catch (_) {}
              }
            }
          }

          if (mounted && !controller.signal.aborted && reconnectCount < MAX_RECONNECTS) {
            const delay = RECONNECT_DELAYS[Math.min(reconnectCount, RECONNECT_DELAYS.length - 1)];
            reconnectCount += 1;
            setTimeout(connect, delay);
          }
        })
        .catch((err) => {
          if (err.name === "AbortError" || !mounted) return;
          if (reconnectCount < MAX_RECONNECTS) {
            const delay = RECONNECT_DELAYS[Math.min(reconnectCount, RECONNECT_DELAYS.length - 1)];
            reconnectCount += 1;
            setTimeout(connect, delay);
          }
        });
    }

    connect();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [orderId, token, isLive]);
}

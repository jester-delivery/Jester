"use client";

import { useEffect, useRef, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

/**
 * Hook pentru SSE stream comenzi disponibile curier.
 * Conectare la GET /courier/orders/available/stream; primește new_available + heartbeat.
 * Când e conectat, nu e nevoie de polling – un singur flux curat.
 */
export function useCourierAvailableStream(
  token: string | null,
  enabled: boolean,
  onNewAvailable: () => void
) {
  const [connected, setConnected] = useState(false);
  const onNewRef = useRef(onNewAvailable);
  onNewRef.current = onNewAvailable;

  useEffect(() => {
    if (!token || !enabled) {
      setConnected(false);
      return;
    }

    const controller = new AbortController();
    let mounted = true;

    const url = `${API_BASE}/courier/orders/available/stream`;
    const headers: Record<string, string> = {
      Accept: "text/event-stream",
      Authorization: `Bearer ${token}`,
    };

    fetch(url, { headers, signal: controller.signal })
      .then(async (res) => {
        if (!res.ok || !res.body || !mounted) {
          setConnected(false);
          return;
        }
        setConnected(true);
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
            if (event === "new_available") {
              onNewRef.current();
            }
          }
        }
        if (mounted) setConnected(false);
      })
      .catch(() => {
        if (mounted) setConnected(false);
      });

    return () => {
      mounted = false;
      setConnected(false);
      controller.abort();
    };
  }, [token, enabled]);

  return { connected };
}

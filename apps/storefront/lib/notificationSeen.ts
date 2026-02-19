/**
 * Persistență locală: comenzi „văzute” (accesate din notificări).
 * Badge-ul de notificări = comenzi active care nu sunt în lista de văzute.
 */

const STORAGE_KEY = "jester_notifications_seen";

export function getSeenOrderIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function markOrderSeen(orderId: string): void {
  if (typeof window === "undefined") return;
  try {
    const seen = new Set(getSeenOrderIds());
    seen.add(orderId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...seen]));
    window.dispatchEvent(new CustomEvent("jester_notifications_seen"));
  } catch {}
}

/** Elimină din listă ID-urile comenzilor finale ca să nu crească la infinit. */
export function clearSeenForFinalOrders(orderIds: string[]): void {
  if (typeof window === "undefined") return;
  try {
    const toRemove = new Set(orderIds);
    const seen = getSeenOrderIds().filter((id) => !toRemove.has(id));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seen));
    window.dispatchEvent(new CustomEvent("jester_notifications_seen"));
  } catch {}
}

/**
 * Consistență globală: culori și label-uri pentru status comenzi.
 * Folosit în: Orders list, Order detail, Admin (dacă e nevoie).
 */

export const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING: "În așteptare",
  CONFIRMED: "Acceptată",
  ACCEPTED: "Acceptată",
  PREPARING: "Se pregătește",
  READY: "Gata",
  DELIVERING: "În livrare",
  ON_THE_WAY: "În drum",
  OUT_FOR_DELIVERY: "În drum",
  DELIVERED: "Livrată",
  CANCELLED: "Anulată",
  CANCELED: "Anulată",
};

/** Statusuri Jester Delivery (pachete): Plasată → Acceptată → Ridicată de curier → Livrată. Folosit când orderType === "package_delivery". */
export const PACKAGE_ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING: "Plasată",
  CONFIRMED: "Acceptată",
  PREPARING: "Ridicată de curier",
  READY: "Ridicată de curier",
  DELIVERING: "Ridicată de curier",
  ON_THE_WAY: "Ridicată de curier",
  OUT_FOR_DELIVERY: "Ridicată de curier",
  DELIVERED: "Livrată",
  CANCELLED: "Anulată",
  CANCELED: "Anulată",
};

/** Statusuri finale – comanda nu mai poate fi modificată */
export const FINAL_ORDER_STATUSES = ["DELIVERED", "CANCELLED", "CANCELED"] as const;

export function isFinalOrderStatus(status: string): boolean {
  return FINAL_ORDER_STATUSES.includes(status as any);
}

/** Număr comenzi „active” (nu finale) – folosit pentru badge notificări MVP */
export function getActiveOrdersCount(orders: { status: string }[]): number {
  return orders.filter((o) => !isFinalOrderStatus(o.status)).length;
}

/** Clasă Tailwind pentru pill-ul de status (același în listă și detaliu) */
export function getOrderStatusClass(status: string): string {
  if (status === "DELIVERED") return "bg-green-500/20 text-green-300";
  if (status === "CANCELLED" || status === "CANCELED") return "bg-red-500/20 text-red-300";
  if (status === "ON_THE_WAY" || status === "OUT_FOR_DELIVERY") return "bg-blue-500/20 text-blue-300";
  return "bg-amber-500/20 text-amber-300";
}

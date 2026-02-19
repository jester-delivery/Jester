/**
 * Mesaje de notificare (toast) cu Jester – funny, memorabile, 4 secunde afișare.
 * Folosit la status comenzi, coș, refuz curier, etc.
 */

export const ORDER_STATUS_TOAST: Record<string, string> = {
  ACCEPTED: "Jester a dat OK! Comanda merge mai departe 🃏",
  CONFIRMED: "Jester a dat OK! Comanda merge mai departe 🃏",
  PREPARING: "Se pregătește... Jester se uită la ce ai luat 😄",
  ON_THE_WAY: "E în drum! Jester aleargă (sau pedalează) spre tine 🛵",
  OUT_FOR_DELIVERY: "E în drum! Jester aleargă (sau pedalează) spre tine 🛵",
  DELIVERED: "Livrat! Jester își ia pauza de la glume 🎉",
  CANCELED: "Anulat. Jester e dezamăgit dar se descurcă 🤷",
  CANCELLED: "Anulat. Jester e dezamăgit dar se descurcă 🤷",
};

export const REFUSAL_TOAST = "Un curier a zis pas. Jester caută pe altul! 🃏";

export const CART_ADD_TOAST = "Adăugat. Ca la carte. 😉";
export const CART_QUANTITY_TOAST = "Cantitate schimbată, Jester a notat ✏️";
export const CART_REMOVE_TOAST = "Scos din coș. Jester a dat înapoi 🃏";

export const ORDER_PLACED_TOAST = "Comandă trimisă! Jester se ocupă 🎭";
export const ORDER_DELETED_TOAST = "Șters. Jester a șters și el din agenda 📋";
export const ORDER_DELETE_ERROR_TOAST = "Ups, n-a mers ștergerea. Jester reîncearcă... 🔄";

export const DELIVERY_REQUEST_TOAST = "Solicitarea trimisă! Jester verifică pachetul 📦";

export const TOAST_DURATION_MS = 4000;

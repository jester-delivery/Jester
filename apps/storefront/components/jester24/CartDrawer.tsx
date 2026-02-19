"use client";

import Image from "next/image";
import { useJester24CartStore } from "@/stores/jester24CartStore";
import { CART_QUANTITY_TOAST, CART_REMOVE_TOAST } from "@/lib/jesterToasts";

type CartDrawerProps = {
  open: boolean;
  onClose: () => void;
  onCheckout: () => void;
  showToast: (msg: string) => void;
};

export default function CartDrawer({
  open,
  onClose,
  onCheckout,
  showToast,
}: CartDrawerProps) {
  const { items, inc, dec, removeItem, getTotalPrice } =
    useJester24CartStore();

  if (!open) return null;

  const totalPrice = getTotalPrice();

  const handleRemove = (id: string) => {
    removeItem(id);
    showToast(CART_REMOVE_TOAST);
  };

  const handleDec = (id: string) => {
    dec(id);
    showToast(CART_QUANTITY_TOAST);
  };

  const handleInc = (id: string) => {
    inc(id);
    showToast(CART_QUANTITY_TOAST);
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <div
        className="fixed inset-x-0 bottom-0 z-50 max-h-[75vh] overflow-hidden rounded-t-3xl bg-[#0a0a12] shadow-2xl transition-transform duration-300"
        style={{ transform: open ? "translateY(0)" : "translateY(100%)" }}
      >
        <div className="flex max-h-[75vh] flex-col">
          {/* Handle */}
          <div className="flex justify-center py-2">
            <div className="h-1 w-12 rounded-full bg-white/30" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <h2 className="text-lg font-bold text-white">Coșul tău</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white"
              aria-label="Închide"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {items.length === 0 ? (
              <p className="py-8 text-center text-white/60">Coșul este gol</p>
            ) : (
              <ul className="space-y-3">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3"
                  >
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">
                        {item.name}
                      </p>
                      <p className="text-sm text-white/70">
                        {(item.price * item.qty).toFixed(2)} lei
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleDec(item.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20"
                        aria-label="Scade"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm font-medium text-white">
                        {item.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleInc(item.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20"
                        aria-label="Adaugă"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemove(item.id)}
                      className="rounded-lg p-2 text-white/50 hover:bg-red-500/20 hover:text-red-300"
                      aria-label="Șterge"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer: Total + Checkout */}
          {items.length > 0 && (
            <div className="border-t border-white/10 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <div className="mb-3 flex justify-between text-lg font-bold text-white">
                <span>Total</span>
                <span>{totalPrice.toFixed(2)} lei</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onCheckout();
                  onClose();
                }}
                className="w-full rounded-xl bg-white py-3 font-semibold text-black transition-opacity hover:opacity-90"
              >
                Continuă la checkout
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

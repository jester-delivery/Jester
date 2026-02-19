"use client";

import { useEffect, useState } from "react";

type CheckoutBarProps = {
  total: number;
  onCheckoutClick: () => void;
  disabled?: boolean;
};

/**
 * Bară fixă jos cu Total + buton Checkout. Theme dark, shadow ușor.
 * Total afișat doar după mount ca să evităm hydration mismatch (store/localStorage).
 */
export default function CheckoutBar({
  total,
  onCheckoutClick,
  disabled = false,
}: CheckoutBarProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const displayTotal = mounted ? total : 0;

  const hasItems = displayTotal > 0;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 transition-all duration-300 ease-out shadow-[0_-4px_20px_rgba(0,0,0,0.25)]">
      <div className="bg-gradient-to-t from-black/40 via-black/20 to-transparent backdrop-blur-sm">
        <div className="mx-auto w-full max-w-lg px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <div
            className={`rounded-t-3xl border-t py-4 shadow-2xl backdrop-blur-xl transition-all duration-300 ${
              hasItems
                ? "border-amber-500/30 bg-white/12 shadow-[0_-6px_24px_rgba(0,0,0,0.3),0_0_0_1px_rgba(251,191,36,0.12)]"
                : "border-white/20 bg-white/10"
            }`}
          >
            <div className="flex items-center justify-between gap-4 px-4">
              <p className="text-lg font-bold text-white">
                Total: <span className="text-white">{displayTotal.toFixed(2)} lei</span>
              </p>
              <button
                type="button"
                onClick={onCheckoutClick}
                disabled={disabled}
                className="shrink-0 rounded-xl bg-white px-6 py-3 font-semibold text-black shadow-md transition-all hover:opacity-90 hover:shadow-lg active:scale-[0.98] disabled:opacity-60"
              >
                Checkout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

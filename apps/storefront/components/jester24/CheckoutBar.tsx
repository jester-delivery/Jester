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

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.25)] transition-all duration-300 ease-out">
      <div className="bg-gradient-to-t from-black/40 via-black/20 to-transparent backdrop-blur-sm">
        <div className="mx-auto w-full max-w-lg px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <div className="rounded-t-3xl border-t border-white/20 bg-white/10 py-4 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4 px-4">
              <p className="text-lg font-bold text-white">
                Total: <span className="text-white">{displayTotal.toFixed(2)} lei</span>
              </p>
              <button
                type="button"
                onClick={onCheckoutClick}
                disabled={disabled}
                className="shrink-0 rounded-xl bg-white px-6 py-3 font-semibold text-black shadow-md transition-opacity hover:opacity-90 disabled:opacity-60"
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

"use client";

import { forwardRef, useEffect, useState } from "react";
import { useJester24CartStore } from "@/stores/jester24CartStore";

type CartHeaderButtonProps = {
  onClick: () => void;
  /** When this value changes, trigger a short bounce (e.g. after fly-to-cart lands) */
  bounceTrigger?: number;
};

const CartHeaderButton = forwardRef<HTMLButtonElement, CartHeaderButtonProps>(
  function CartHeaderButton({ onClick, bounceTrigger = 0 }, ref) {
    const totalItems = useJester24CartStore((s) => s.getTotalItems());
    const [mounted, setMounted] = useState(false);
    const [bounce, setBounce] = useState(false);
    const [prevCount, setPrevCount] = useState(0);
    const [badgePop, setBadgePop] = useState(false);

    useEffect(() => {
      setMounted(true);
    }, []);

    useEffect(() => {
      if (bounceTrigger > 0) {
        setBounce(true);
        const t = setTimeout(() => setBounce(false), 320);
        return () => clearTimeout(t);
      }
    }, [bounceTrigger]);

    useEffect(() => {
      if (!mounted) return;
      if (totalItems > prevCount && prevCount >= 0) {
        setBadgePop(true);
        const t = setTimeout(() => setBadgePop(false), 400);
        setPrevCount(totalItems);
        return () => clearTimeout(t);
      }
      setPrevCount(totalItems);
    }, [totalItems, mounted, prevCount]);

    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        className={`
          relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full
          bg-white/15 shadow-lg backdrop-blur-md transition-transform duration-200
          hover:scale-105 hover:bg-white/20 active:scale-95
          ${bounce ? "animate-cart-bounce" : ""}
        `}
        aria-label="Deschide coșul"
      >
        <svg
          className="h-5 w-5 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        {mounted && totalItems > 0 && (
          <span
            className={`
              absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center
              rounded-full bg-amber-500 px-1 text-xs font-bold text-black
              transition-transform duration-200
              ${badgePop ? "scale-125" : "scale-100"}
            `}
          >
            {totalItems > 99 ? "99+" : totalItems}
          </span>
        )}
      </button>
    );
  }
);

export default CartHeaderButton;

"use client";

import { useEffect, useState } from "react";
import { useJester24CartStore } from "@/stores/jester24CartStore";

type CartFloatingButtonProps = {
  onClick: () => void;
};

export default function CartFloatingButton({ onClick }: CartFloatingButtonProps) {
  const totalItems = useJester24CartStore((s) => s.getTotalItems());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-white/15 shadow-lg backdrop-blur-md transition-transform hover:scale-105 active:scale-95"
      aria-label="Deschide coșul"
    >
      <svg
        className="h-6 w-6 text-white"
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
        <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-black">
          {totalItems > 99 ? "99+" : totalItems}
        </span>
      )}
    </button>
  );
}

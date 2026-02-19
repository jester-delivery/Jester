"use client";

import { useRef, useState, useCallback, useEffect } from "react";

const SWIPE_THRESHOLD = 80;
const SWIPE_MAX = 120;
const VIBRATE_MS = 50;
/** Dacă mișcarea e mai mult orizontală decât această valoare, considerăm swipe (nu scroll). */
const SWIPE_VS_SCROLL = 12;

type Props = {
  orderId: string;
  isRemoving?: boolean;
  onSwipeDelete: (orderId: string) => void;
  children: React.ReactNode;
};

export default function SwipeableNotificationCard({
  orderId,
  isRemoving = false,
  onSwipeDelete,
  children,
}: Props) {
  const [translateX, setTranslateX] = useState(0);
  const [hasVibrated, setHasVibrated] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const translateXRef = useRef(0);
  const swipeLocked = useRef(false);
  const slideRef = useRef<HTMLDivElement>(null);

  const triggerVibrate = useCallback(() => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(VIBRATE_MS);
    }
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (isRemoving) return;
      startX.current = e.touches[0].clientX;
      startY.current = e.touches[0].clientY;
      translateXRef.current = translateX;
      swipeLocked.current = false;
      setHasVibrated(false);
    },
    [isRemoving, translateX]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (isRemoving) return;
      const x = e.touches[0].clientX;
      const y = e.touches[0].clientY;
      const deltaX = x - startX.current;
      const deltaY = y - startY.current;
      if (!swipeLocked.current) {
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);
        if (absY > absX && absY > SWIPE_VS_SCROLL) {
          return;
        }
        if (absX > SWIPE_VS_SCROLL || absY > SWIPE_VS_SCROLL) {
          swipeLocked.current = true;
        }
      }
      const next = Math.min(0, Math.max(-SWIPE_MAX, deltaX));
      translateXRef.current = next;
      setTranslateX(next);
      if (next <= -SWIPE_THRESHOLD && !hasVibrated) {
        setHasVibrated(true);
        triggerVibrate();
      }
    },
    [isRemoving, hasVibrated, triggerVibrate]
  );

  const handleTouchEnd = useCallback(() => {
    if (isRemoving) return;
    const current = translateXRef.current;
    if (current <= -SWIPE_THRESHOLD) {
      onSwipeDelete(orderId);
      return;
    }
    setTranslateX(0);
    translateXRef.current = 0;
  }, [isRemoving, orderId, onSwipeDelete]);

  useEffect(() => {
    const el = slideRef.current;
    if (!el) return;
    const onMove = (e: TouchEvent) => {
      if (swipeLocked.current) e.preventDefault();
    };
    el.addEventListener("touchmove", onMove, { passive: false });
    return () => el.removeEventListener("touchmove", onMove);
  }, []);

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{
        transition: isRemoving ? "max-height 0.35s cubic-bezier(0.33, 1, 0.68, 1), opacity 0.3s ease-out, margin-bottom 0.35s ease-out" : "none",
        maxHeight: isRemoving ? 0 : 200,
        opacity: isRemoving ? 0 : 1,
        marginBottom: isRemoving ? 0 : 12,
      }}
    >
      {/* Roșu + icon apasabil: tap aici șterge notificarea */}
      <div
        className="absolute inset-0 flex items-center justify-end rounded-2xl pr-2 pointer-events-none"
        aria-hidden
      >
        <button
          type="button"
          onClick={() => onSwipeDelete(orderId)}
          className="pointer-events-auto flex h-full w-[120px] shrink-0 cursor-pointer items-center justify-center rounded-r-2xl bg-red-500/30 transition active:bg-red-500/50 border-0 touch-manipulation"
          aria-label="Ascunde notificarea"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/60 text-white pointer-events-none">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </span>
        </button>
      </div>

      {/* Card opac – la glisare spre stânga se vede roșul din dreapta */}
      <div
        ref={slideRef}
        className="relative z-10 min-w-full rounded-2xl bg-[#070710] select-none"
        style={{
          transform: `translateX(${translateX}px)`,
          transition: translateX === 0 ? "transform 0.25s cubic-bezier(0.33, 1, 0.68, 1)" : "none",
          touchAction: "pan-y",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}

"use client";

import Image from "next/image";
import { useEffect, useState, useRef } from "react";

const FLY_DURATION_MS = 450;
const FLY_SIZE = 40;

type FlyToCartProps = {
  fromRect: DOMRect;
  imageUrl: string;
  cartRef: React.RefObject<HTMLButtonElement | null>;
  onComplete: () => void;
};

export default function FlyToCart({
  fromRect,
  imageUrl,
  cartRef,
  onComplete,
}: FlyToCartProps) {
  const [toPos, setToPos] = useState<{ x: number; y: number } | null>(null);
  const [started, setStarted] = useState(false);
  const completedRef = useRef(false);

  useEffect(() => {
    const cart = cartRef.current;
    if (!cart) {
      onComplete();
      return;
    }
    const rect = cart.getBoundingClientRect();
    setToPos({
      x: rect.left + rect.width / 2 - FLY_SIZE / 2,
      y: rect.top + rect.height / 2 - FLY_SIZE / 2,
    });
    requestAnimationFrame(() => setStarted(true));
  }, [cartRef, onComplete]);

  useEffect(() => {
    if (!toPos || !started) return;
    const t = setTimeout(() => {
      if (completedRef.current) return;
      completedRef.current = true;
      onComplete();
    }, FLY_DURATION_MS);
    return () => clearTimeout(t);
  }, [toPos, started, onComplete]);

  const startX = fromRect.left + fromRect.width / 2 - FLY_SIZE / 2;
  const startY = fromRect.top + fromRect.height / 2 - FLY_SIZE / 2;

  if (!toPos) return null;

  return (
    <div
      className="pointer-events-none fixed z-[100] rounded-full shadow-2xl ring-2 ring-white/30"
      style={{
        width: FLY_SIZE,
        height: FLY_SIZE,
        left: started ? toPos.x : startX,
        top: started ? toPos.y : startY,
        transition: `left ${FLY_DURATION_MS}ms cubic-bezier(0.25, 0.46, 0.45, 0.94), top ${FLY_DURATION_MS}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
      }}
    >
      <div className="h-full w-full overflow-hidden rounded-full bg-[#0a0a12]">
        <Image
          src={imageUrl}
          alt=""
          width={FLY_SIZE}
          height={FLY_SIZE}
          className="object-cover"
        />
      </div>
      {/* subtle motion blur / shadow layer */}
      <div
        className="absolute inset-0 rounded-full bg-black/20 animate-fly-land"
        aria-hidden
      />
    </div>
  );
}

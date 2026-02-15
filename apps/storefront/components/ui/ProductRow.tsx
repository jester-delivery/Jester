"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useJester24CartStore } from "@/stores/jester24CartStore";

type ProductRowProps = {
  name: string;
  price: number;
  image: string;
  restricted18?: boolean;
  /** When provided, row is clickable and shows Add / stepper for Jester24 cart */
  id?: string;
  section?: string;
  showToast?: (msg: string) => void;
};

/**
 * Un rând full-width: imagine stânga, info dreapta. Un singur produs pe rând.
 * Cu id + section: card clickable, buton Add (+) sau stepper [-] qty [+].
 * Cart state synced in useEffect to avoid hydration mismatch (localStorage).
 */
export default function ProductRow({
  name,
  price,
  image,
  restricted18,
  id,
  section,
  showToast,
}: ProductRowProps) {
  const addItem = useJester24CartStore((s) => s.addItem);
  const inc = useJester24CartStore((s) => s.inc);
  const dec = useJester24CartStore((s) => s.dec);
  const items = useJester24CartStore((s) => s.items);

  const [quantity, setQuantity] = useState(0);

  useEffect(() => {
    if (!id) return;
    const item = items.find((i) => i.id === id);
    setQuantity(item?.qty ?? 0);
  }, [id, items]);

  const isInCart = quantity > 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!id || !section) return;
    addItem({ id, name, price, image, section });
    showToast?.("Produs adăugat în coș");
  };

  const handleInc = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!id) return;
    inc(id);
    showToast?.("Cantitate actualizată");
  };

  const handleDec = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!id) return;
    dec(id);
    showToast?.("Cantitate actualizată");
  };

  const handleRowClick = () => {
    if (!id || !section) return;
    if (!isInCart) {
      addItem({ id, name, price, image, section });
      showToast?.("Produs adăugat în coș");
    }
  };

  const isCartEnabled = Boolean(id && section);

  return (
    <div
      role={isCartEnabled ? "button" : undefined}
      tabIndex={isCartEnabled ? 0 : undefined}
      onClick={isCartEnabled ? handleRowClick : undefined}
      onKeyDown={
        isCartEnabled
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleRowClick();
              }
            }
          : undefined
      }
      className="group relative flex w-full cursor-pointer overflow-hidden rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md transition-all duration-200 hover:border-white/30 hover:bg-white/15"
    >
      {/* +18 badge */}
      {restricted18 && (
        <div className="absolute right-3 top-3 z-10 rounded-lg bg-amber-500/95 px-2 py-1 text-[10px] font-bold text-black shadow-md">
          +18
        </div>
      )}

      {/* Imagine stânga */}
      <div className="relative h-24 w-24 shrink-0 sm:h-28 sm:w-28">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="112px"
        />
      </div>

      {/* Info dreapta */}
      <div className="flex flex-1 flex-col justify-center gap-1 px-4 py-3">
        <h3 className="text-base font-semibold text-white line-clamp-2 sm:text-lg">
          {name}
        </h3>
        <p className="text-lg font-bold text-white">
          {price.toFixed(2)}{" "}
          <span className="text-sm font-normal text-white/70">lei</span>
        </p>
      </div>

      {/* Add / Stepper (dreapta jos) - doar când id + section */}
      {isCartEnabled && (
        <div
          className="flex shrink-0 items-center gap-1 self-end pb-3 pr-3"
          onClick={(e) => e.stopPropagation()}
        >
          {!isInCart ? (
            <button
              type="button"
              onClick={handleAdd}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30"
              aria-label="Adaugă în coș"
            >
              <span className="text-lg font-bold">+</span>
            </button>
          ) : (
            <div className="flex items-center gap-0.5 rounded-full bg-white/15 px-1">
              <button
                type="button"
                onClick={handleDec}
                className="flex h-8 w-8 items-center justify-center rounded-full text-white hover:bg-white/20"
                aria-label="Scade"
              >
                −
              </button>
              <span className="min-w-[1.5rem] text-center text-sm font-semibold text-white">
                {quantity}
              </span>
              <button
                type="button"
                onClick={handleInc}
                className="flex h-8 w-8 items-center justify-center rounded-full text-white hover:bg-white/20"
                aria-label="Adaugă"
              >
                +
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

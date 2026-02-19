"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import { useJester24CartStore } from "@/stores/jester24CartStore";
import { CART_ADD_TOAST, CART_QUANTITY_TOAST } from "@/lib/jesterToasts";

type ProductRowProps = {
  name: string;
  price: number;
  image: string;
  /** Optional short description (e.g. for pizza page) */
  description?: string;
  restricted18?: boolean;
  /** Din API: false = produsul apare dar nu poate fi adăugat (badge Indisponibil) */
  isAvailable?: boolean;
  /** When provided, row is clickable and shows Add / stepper for global cart */
  id?: string;
  section?: string;
  showToast?: (msg: string) => void;
  /** Callback when adding to cart: (fromRect, imageUrl) for fly-to-cart animation */
  onAddWithFly?: (fromRect: DOMRect, imageUrl: string) => void;
  /** When provided (e.g. Jester 24/24), tap on image opens premium preview instead of adding to cart */
  onImagePreview?: (image: string, name: string) => void;
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
  description,
  restricted18,
  isAvailable = true,
  id,
  section,
  showToast,
  onAddWithFly,
  onImagePreview,
}: ProductRowProps) {
  const addItem = useJester24CartStore((s) => s.addItem);
  const inc = useJester24CartStore((s) => s.inc);
  const dec = useJester24CartStore((s) => s.dec);
  const items = useJester24CartStore((s) => s.items);

  const [quantity, setQuantity] = useState(0);
  /** Micro-feedback: scurt highlight pe butonul + după add (scale + ring). */
  const [addFeedback, setAddFeedback] = useState(false);

  useEffect(() => {
    if (!id) return;
    const item = items.find((i) => i.id === id);
    setQuantity(item?.qty ?? 0);
  }, [id, items]);

  const isInCart = quantity > 0;

  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerAddFeedback = useCallback(() => {
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    setAddFeedback(true);
    feedbackTimeoutRef.current = setTimeout(() => {
      setAddFeedback(false);
      feedbackTimeoutRef.current = null;
    }, 320);
  }, []);
  useEffect(() => () => { if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current); }, []);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!id || !section || !isAvailable) return;
    addItem({ id, name, price, image, section });
    triggerAddFeedback();
    showToast?.(CART_ADD_TOAST);
    const target = (e.target as HTMLElement).closest("button") ?? (e.currentTarget as HTMLElement);
    const rect = target.getBoundingClientRect();
    onAddWithFly?.(rect, image);
  };

  const handleInc = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!id) return;
    inc(id);
    triggerAddFeedback();
    showToast?.(CART_QUANTITY_TOAST);
  };

  const handleDec = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!id) return;
    dec(id);
    showToast?.(CART_QUANTITY_TOAST);
  };

  const isCartEnabled = Boolean(id && section && isAvailable);

  const handleImageClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onImagePreview) {
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(30);
      onImagePreview(image, name);
    }
  };

  return (
    <div
      className={`group relative flex w-full overflow-hidden rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md transition-all duration-200 ${isCartEnabled ? "hover:border-white/25 hover:bg-white/10" : "cursor-default opacity-80"}`}
    >
      {/* Indisponibil badge */}
      {id && section && !isAvailable && (
        <div className="absolute right-3 top-3 z-10 rounded-lg bg-red-500/90 px-2 py-1 text-[10px] font-bold text-white shadow-md">
          Indisponibil
        </div>
      )}
      {/* +18 badge */}
      {restricted18 && (
        <div className="absolute right-3 top-3 z-10 rounded-lg bg-amber-500/95 px-2 py-1 text-[10px] font-bold text-black shadow-md">
          +18
        </div>
      )}

      {/* Imagine stânga – click doar pentru preview (Jester 24/24), nu adaugă în coș */}
      <div
        className={`relative h-24 w-24 shrink-0 sm:h-28 sm:w-28 overflow-hidden rounded-l-2xl ${onImagePreview ? "cursor-pointer" : ""}`}
        onClick={onImagePreview ? handleImageClick : undefined}
        role={onImagePreview ? "button" : undefined}
        aria-label={onImagePreview ? `Mărește imaginea: ${name}` : undefined}
      >
        <Image
          src={image}
          alt={name}
          fill
          className={`object-cover transition-transform duration-300 ${onImagePreview ? "active:scale-95 group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.12)]" : "group-hover:scale-105"}`}
          sizes="112px"
          unoptimized={image.startsWith("/api/")}
        />
      </div>

      {/* Info dreapta – preț evidențiat (bold, separat de descriere) */}
      <div className="flex flex-1 flex-col justify-center gap-1 px-4 py-3 min-w-0 overflow-hidden">
        <h3 className="text-base font-semibold text-white line-clamp-2 sm:text-lg">
          {name}
        </h3>
        {description && (
          <p className="text-xs text-white/70 line-clamp-2 sm:text-sm">{description}</p>
        )}
        <div className="mt-2 border-t border-white/20 pt-2">
          <p className="text-xl font-bold text-white tracking-tight">
            {price.toFixed(2)}{" "}
            <span className="text-sm font-semibold text-white/80">lei</span>
          </p>
        </div>
      </div>

      {/* Add / Stepper (dreapta jos) - doar când id + section + isAvailable */}
      {id && section && (
        <div
          className="flex shrink-0 items-center gap-1 self-end pb-3 pr-3"
          onClick={(e) => e.stopPropagation()}
        >
          {!isAvailable ? (
            <span className="text-xs text-white/50">Nu se poate adăuga</span>
          ) : !isInCart ? (
            <button
              type="button"
              onClick={handleAdd}
              className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white transition-all duration-200 hover:bg-white/30 active:scale-95 ${
                addFeedback ? "scale-105 ring-2 ring-amber-400/70" : ""
              }`}
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
                className={`flex h-8 w-8 items-center justify-center rounded-full text-white transition-all duration-200 hover:bg-white/20 active:scale-95 ${
                  addFeedback ? "scale-105 ring-2 ring-amber-400/60" : ""
                }`}
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

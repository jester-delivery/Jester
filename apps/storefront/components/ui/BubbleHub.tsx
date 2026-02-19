"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/lib/api";

const DEFAULT_LOGO = "https://i.imgur.com/W5X0s4C.jpeg";

/** Înălțimi estimate pentru safe area. */
const SEARCH_AREA_HEIGHT_PX = 88;
const BOTTOM_NAV_HEIGHT_PX = 88;

/** Crosshair temporar pentru debug – pune true ca să verifici centrul, apoi scoate. */
const DEBUG_CROSSHAIR = false;

/**
 * Dimensiuni țintă pe mobil: normale ~115px, Jester 24/24 ~140px (proporțional cu viewport).
 * Raportate la min(W,H); pe ~340px minDim → ~115px și ~140px.
 */
const SURROUNDING_DIAMETER_RATIO = 0.34; // bule normale ≈ 115px pe 340px viewport
const CENTER_DIAMETER_RATIO = 0.41;      // Jester 24/24 ≈ 140px, clar mai mare decât restul
const GAP_RATIO = 0.02;                  // gap minim între bule (2% din minDim) – folosit pentru R

type Bubble = {
  title: string;
  href: string;
  image: string;
  left: number;
  top: number;
  size: number;
  priority?: boolean;
};

/** Slug-uri fixe: centru = Jester 24/24, poziția 1 = Pizza. */
const CENTER_SLUG = "jester-24-24";
const TOP_SLUG = "pizza";

/**
 * Reordonează: Jester 24/24 mereu centru (index 0), Pizza mereu următor (index 1), restul păstrează ordinea din API.
 */
function orderCategoriesForHub<T extends { slug: string }>(categories: T[]): T[] {
  const center = categories.find((c) => c.slug.toLowerCase() === CENTER_SLUG);
  const top = categories.find((c) => c.slug.toLowerCase() === TOP_SLUG);
  const rest = categories.filter(
    (c) => c.slug.toLowerCase() !== CENTER_SLUG && c.slug.toLowerCase() !== TOP_SLUG
  );
  const ordered: T[] = [];
  if (center) ordered.push(center);
  if (top) ordered.push(top);
  ordered.push(...rest);
  return ordered;
}

/**
 * Poziționare radială: centru fix, restul pe cerc cu unghiuri egale (360°/n).
 * Raza R este derivată din diametre + gap – zero overlap, zero poziții hardcodate.
 *
 * centerX, centerY = mijlocul zonei
 * radius = distanța de la centru la centrele bulelor periferice (calculată din geometrie)
 * pentru fiecare bulă periferică: x = centerX + radius * cos(angle), y = centerY + radius * sin(angle)
 */
function computeBubbleLayout(
  width: number,
  height: number,
  count: number
): { left: number; top: number; size: number; priority: boolean }[] {
  const minDim = Math.min(width, height);
  const centerX = width / 2;
  const centerY = height / 2;

  const centerSize = minDim * CENTER_DIAMETER_RATIO;
  const surroundingSize = minDim * SURROUNDING_DIAMETER_RATIO;
  const centerRadius = centerSize / 2;
  const surroundingRadius = surroundingSize / 2;
  const gap = minDim * GAP_RATIO;

  const n = Math.max(1, count - 1);

  // R minim: centru–periferic (să nu se atingă centrul cu perifericele)
  const R_min_center = centerRadius + surroundingRadius + gap;
  // R minim: periferic–periferic (coardă între două alăturate >= 2 * surroundingRadius)
  const R_min_adjacent = surroundingRadius / Math.sin(Math.PI / n);
  const R = Math.max(R_min_center, R_min_adjacent);

  const positions: { left: number; top: number; size: number; priority: boolean }[] = [];

  // Jester 24/24 – fix în centru
  positions.push({
    left: centerX,
    top: centerY,
    size: centerSize,
    priority: true,
  });

  // Restul bulelor – pe cerc, unghiuri egale (360° / n), primul sus
  for (let i = 0; i < n; i++) {
    const angleRad = (i / n) * 2 * Math.PI - Math.PI / 2;
    positions.push({
      left: centerX + R * Math.cos(angleRad),
      top: centerY + R * Math.sin(angleRad),
      size: surroundingSize,
      priority: false,
    });
  }

  return positions;
}

type BubbleItemProps = Bubble;

function BubbleItem({ title, href, image, left, top, size, priority }: BubbleItemProps) {
  const imgSrc = image || DEFAULT_LOGO;

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{
        left: `${left}px`,
        top: `${top}px`,
        width: `${size}px`,
        height: `${size}px`,
      }}
    >
      <Link
        href={href}
        className="group touch-manipulation block h-full w-full"
      >
        <div className="relative h-full w-full overflow-hidden rounded-full ring-2 ring-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.6)] transition-transform duration-300 hover:scale-105 hover:ring-white/30 active:scale-95">
          <Image
            src={imgSrc}
            alt={title}
            fill
            className="object-cover"
            priority={!!priority}
            sizes={`(max-width: 640px) ${Math.round(size * 0.6)}px, (max-width: 1024px) ${Math.round(size * 0.8)}px, ${size}px`}
            unoptimized={imgSrc.startsWith("data:")}
          />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,transparent_35%,rgba(0,0,0,0.7)_100%)]" />
          <div className="absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 w-full px-2">
            <div className="rounded-full bg-black/60 backdrop-blur-md px-3 sm:px-4 py-1.5 sm:py-2 border border-white/10 shadow-lg">
              <span className="text-[10px] sm:text-xs font-bold tracking-wide text-white block text-center whitespace-nowrap">
                {title}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

/**
 * BubbleHub: categorii active din API, layout calculat matematic – full screen, fără suprapuneri.
 */
export default function BubbleHub() {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const updateLayout = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const width = el.offsetWidth;
    const height = el.offsetHeight;
    if (width <= 0 || height <= 0) return;

    setBubbles((prev) => {
      if (prev.length === 0) return prev;
      const layout = computeBubbleLayout(width, height, prev.length);
      return prev.map((b, i) => {
        const pos = layout[i];
        if (!pos) return b;
        return {
          ...b,
          left: pos.left,
          top: pos.top,
          size: pos.size,
          priority: pos.priority,
        };
      });
    });
  }, []);

  // Încarcă categorii
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.categories.getAll({ activeOnly: "1" });
        const list = res.data.categories ?? [];
        const ordered = orderCategoriesForHub(list);
        const minDim = 320;
        const layout = computeBubbleLayout(minDim, minDim, ordered.length);
        const mapped: Bubble[] = ordered.map((c, i) => {
          const pos = layout[i] ?? layout[0]!;
          return {
            title: c.name,
            href: `/${c.slug}`,
            image: c.image ?? DEFAULT_LOGO,
            left: pos.left,
            top: pos.top,
            size: pos.size,
            priority: pos.priority,
          };
        });
        if (!cancelled) setBubbles(mapped);
      } catch {
        if (!cancelled) setBubbles([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Recalculează layout la resize; la mount rulează după paint ca containerul să aibă dimensiuni
  useEffect(() => {
    if (bubbles.length === 0) return;
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => updateLayout());
    ro.observe(el);
    const raf = requestAnimationFrame(() => updateLayout());
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [bubbles.length, updateLayout]);

  const playgroundHeight = `calc(100vh - ${SEARCH_AREA_HEIGHT_PX}px - ${BOTTOM_NAV_HEIGHT_PX}px)`;

  return (
    <section
      className="relative z-0 mx-auto w-full max-w-4xl px-4 sm:px-5 overflow-visible flex flex-col"
      style={{ height: playgroundHeight, minHeight: 320 }}
    >
      <div
        ref={containerRef}
        className="relative flex-1 w-full min-h-0 overflow-visible -translate-y-16"
      >
        {DEBUG_CROSSHAIR && (
          <>
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-red-500/60 -translate-x-1/2 pointer-events-none z-0" />
            <div className="absolute top-1/2 left-0 right-0 h-px bg-red-500/60 -translate-y-1/2 pointer-events-none z-0" />
          </>
        )}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-white/60 text-sm">
            Se încarcă bulele...
          </div>
        )}
        {!loading &&
          bubbles.map((bubble) => (
            <BubbleItem key={bubble.href} {...bubble} />
          ))}
      </div>
    </section>
  );
}

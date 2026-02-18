"use client";

import Link from "next/link";
import Image from "next/image";

const LOGO = "https://i.imgur.com/W5X0s4C.jpeg";

/** Înălțimi estimate pentru safe area – folosite doar pentru minHeight, nu pentru calc dinamic. */
const SEARCH_AREA_HEIGHT_PX = 72;
const BOTTOM_NAV_HEIGHT_PX = 80;

/** Crosshair temporar pentru debug – pune true ca să verifici centrul, apoi scoate. */
const DEBUG_CROSSHAIR = false;

type Bubble = {
  title: string;
  href: string;
  left: string;
  top: string;
  size: number;
  priority?: boolean;
};

/** Poziții inline, fără animație – garantat în cadru pe toate ecranele (procente conservatoare). */
const bubbles: Bubble[] = [
  { title: "Jester 24/24", href: "/jester-24-24", left: "50%", top: "50%", size: 200, priority: true },
  { title: "Pizza", href: "/pizza", left: "50%", top: "28%", size: 140 },
  { title: "Bake", href: "/bake", left: "50%", top: "72%", size: 140 },
  { title: "Supply", href: "/supply", left: "30%", top: "38%", size: 130 },
  { title: "Grill", href: "/grill", left: "70%", top: "38%", size: 130 },
  { title: "Jester Delivery", href: "/delivery", left: "30%", top: "62%", size: 130 },
  { title: "Antiq", href: "/antiq", left: "70%", top: "62%", size: 130 },
];

type BubbleItemProps = Bubble;

function BubbleItem({ title, href, left, top, size, priority }: BubbleItemProps) {
  const bubbleSize = `clamp(${Math.round(size * 0.45)}px, min(${size}px, 24vw), ${size}px)`;

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{
        left,
        top,
        width: bubbleSize,
        height: bubbleSize,
      }}
    >
      <Link
        href={href}
        className="group touch-manipulation block h-full w-full"
      >
        <div className="relative h-full w-full overflow-hidden rounded-full ring-2 ring-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.6)] transition-transform duration-300 hover:scale-105 hover:ring-white/30 active:scale-95">
        <Image
          src={LOGO}
          alt={title}
          fill
          className="object-cover"
          priority={!!priority}
          sizes={`(max-width: 640px) ${size * 0.6}px, (max-width: 1024px) ${size * 0.8}px, ${size}px`}
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
 * BubbleHub: poziții inline (left/top %), fără animație – bulele rămân în cadru pe toate ecranele.
 */
export default function BubbleHub() {
  const playgroundHeight = `calc(100vh - ${SEARCH_AREA_HEIGHT_PX}px - ${BOTTOM_NAV_HEIGHT_PX}px)`;

  return (
    <section
      className="relative z-0 mx-auto w-full max-w-4xl px-4 overflow-visible"
      style={{ height: playgroundHeight, minHeight: 320 }}
    >
      {/* Playground: înălțime fixă (100vh), poziții din positionClass */}
      <div className="relative w-full h-full overflow-visible">
        {DEBUG_CROSSHAIR && (
          <>
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-red-500/60 -translate-x-1/2 pointer-events-none z-0" />
            <div className="absolute top-1/2 left-0 right-0 h-px bg-red-500/60 -translate-y-1/2 pointer-events-none z-0" />
          </>
        )}
        {bubbles.map((bubble) => (
          <BubbleItem key={bubble.title} {...bubble} />
        ))}
      </div>
    </section>
  );
}

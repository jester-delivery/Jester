"use client";

import Link from "next/link";
import Image from "next/image";

const LOGO = "https://i.imgur.com/W5X0s4C.jpeg";

type Bubble = {
  title: string;
  href: string;
  x: number; // %
  y: number; // %
  size: number; // px
  priority?: boolean;
};

/**
 * Configurație bule simetrice în jurul Jester 24/24 (centru)
 * Layout echilibrat și aerisit
 */
const bubbles: Bubble[] = [
  // Centru - Jester 24/24 (element principal)
  { title: "Jester 24/24", href: "/jester-24-24", x: 50, y: 50, size: 200, priority: true },

  // Sus - Pizza (centrat)
  { title: "Pizza", href: "/pizza", x: 50, y: 20, size: 140 },

  // Stânga sus - Supply
  { title: "Supply", href: "/supply", x: 20, y: 35, size: 130 },

  // Dreapta sus - Grill
  { title: "Grill", href: "/grill", x: 80, y: 35, size: 130 },

  // Stânga jos - Jester Delivery
  { title: "Jester Delivery", href: "/delivery", x: 20, y: 70, size: 130 },

  // Dreapta jos - Antiq
  { title: "Antiq", href: "/antiq", x: 80, y: 70, size: 130 },

  // Jos - Bake (centrat)
  { title: "Bake", href: "/bake", x: 50, y: 85, size: 140 },
];

type BubbleItemProps = Bubble;

function BubbleItem({ title, href, x, y, size, priority }: BubbleItemProps) {
  // Responsive sizing pentru bule
  const responsiveSize = `clamp(${size * 0.6}px, ${size * 0.8}vw, ${size}px)`;
  
  return (
    <Link
      href={href}
      className="absolute -translate-x-1/2 -translate-y-1/2 group touch-manipulation"
      style={{ 
        left: `${x}%`, 
        top: `${y}%`, 
        width: responsiveSize,
        height: responsiveSize,
      }}
    >
      <div className="relative h-full w-full overflow-hidden rounded-full ring-2 ring-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.6)] transition-all duration-300 hover:scale-105 hover:ring-white/30 active:scale-95">
        {/* Image */}
        <Image
          src={LOGO}
          alt={title}
          fill
          className="object-cover"
          priority={!!priority}
          sizes={`(max-width: 640px) ${size * 0.6}px, (max-width: 1024px) ${size * 0.8}px, ${size}px`}
        />
        
        {/* Overlay gradient */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,transparent_35%,rgba(0,0,0,0.7)_100%)]" />
        
        {/* Label */}
        <div className="absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 w-full px-2">
          <div className="rounded-full bg-black/60 backdrop-blur-md px-3 sm:px-4 py-1.5 sm:py-2 border border-white/10 shadow-lg">
            <span className="text-[10px] sm:text-xs font-bold tracking-wide text-white block text-center whitespace-nowrap">
              {title}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/**
 * BubbleHub Component
 * 
 * Hub cu bule simetrice pentru categorii
 * Layout echilibrat și responsive
 */
export default function BubbleHub() {
  return (
    <section className="relative mx-auto w-full max-w-4xl px-4 py-8 sm:py-12 pb-32">
      {/* Container pentru bule - responsive sizing */}
      <div className="relative aspect-square w-full max-w-[500px] sm:max-w-[600px] md:max-w-[700px] mx-auto">
        {bubbles.map((bubble) => (
          <BubbleItem key={bubble.title} {...bubble} />
        ))}
      </div>
    </section>
  );
}

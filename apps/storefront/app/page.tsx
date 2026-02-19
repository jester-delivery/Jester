"use client";

import SearchBar from "@/components/ui/SearchBar";
import BubbleHub from "@/components/ui/BubbleHub";
import BottomNavigation from "@/components/ui/BottomNavigation";

/**
 * Homepage - Jester Food Delivery
 * 
 * Design modern, profesional, optimizat mobile-first
 * - Search bar sus (placeholder pentru adresă)
 * - Hub cu bule simetrice pentru categorii
 * - Bottom navigation fixată jos
 */
const BG_BASE = "#070b18"; // Navy / midnight – fără albastru deschis, profunzime și eleganță

export default function Home() {
  return (
    <main
      className="min-h-screen text-white overflow-x-hidden relative pb-24"
      style={{ backgroundColor: BG_BASE }}
    >
      {/* Spotlight radial subtil centrat pe Jester 24/24 – lumină difuză, nu neon */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 85% 70% at 50% 42%, rgba(255,255,255,0.035) 0%, transparent 55%)`,
        }}
      />
      {/* Vignette – marginile puțin mai închise, senzație cinematică */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 100% 100% at 50% 50%, transparent 25%, rgba(0,0,0,0.35) 100%)`,
        }}
      />
      {/* Textură foarte fină – noise discret, nu fundal digital plat */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.028] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        {/* Search Bar */}
        <SearchBar />

        {/* Bubble Hub */}
        <BubbleHub />
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </main>
  );
}

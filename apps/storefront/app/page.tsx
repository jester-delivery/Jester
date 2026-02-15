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
export default function Home() {
  return (
    <main className="min-h-screen text-white overflow-x-hidden relative pb-24 bg-gradient-to-b from-[#050610] via-[#040411] to-[#050610]">
      {/* Background gradients pentru depth */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 left-0 w-[600px] h-[600px] bg-cyan-500/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-[700px] h-[700px] bg-blue-500/8 rounded-full blur-3xl" />
      </div>

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

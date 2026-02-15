"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useState, useEffect, useRef } from "react";

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

const navItems: NavItem[] = [
  {
    label: "Home",
    href: "/",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: "Search",
    href: "/search",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    label: "Orders",
    href: "/orders",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    label: "Profile",
    href: "/profile",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

type BottomNavigationProps = {
  /** Ascunde bara la scroll în jos, arată la scroll în sus (tranziție smooth) */
  hideOnScrollDown?: boolean;
};

/**
 * BottomNavigation Component
 *
 * Bară de navigare fixată jos cu 4 butoane
 * Optimizată pentru mobile-first, dar arată bine și pe desktop
 */
export default function BottomNavigation({
  hideOnScrollDown = false,
}: BottomNavigationProps = {}) {
  const pathname = usePathname();
  const { isAuthenticated } = useAuthStore();
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    if (!hideOnScrollDown) return;

    const SCROLL_THRESHOLD = 8;
    const handleScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        const y = window.scrollY ?? window.pageYOffset;
        if (y <= 0) {
          setVisible(true);
        } else if (y > lastScrollY.current && y - lastScrollY.current > SCROLL_THRESHOLD) {
          setVisible(false);
        } else if (lastScrollY.current - y > SCROLL_THRESHOLD) {
          setVisible(true);
        }
        lastScrollY.current = y;
        ticking.current = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hideOnScrollDown]);

  const isHidden = hideOnScrollDown && !visible;

  return (
    <nav
      className={`fixed inset-x-0 bottom-0 z-50 safe-area-bottom transition-all duration-300 ease-out ${
        isHidden ? "translate-y-full opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
      {/* Background blur pentru efect glassmorphism */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/20 to-transparent backdrop-blur-sm" />
      
      {/* Container principal */}
      <div className="relative mx-auto w-full max-w-lg px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="rounded-t-3xl bg-white/10 backdrop-blur-xl border-t border-white/20 shadow-2xl">
          <div className="flex items-center justify-around px-2 py-3">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              
              // Pentru Profile, verifică dacă utilizatorul este autentificat
              if (item.label === "Profile" && !isAuthenticated) {
                return (
                  <Link
                    key={item.label}
                    href="/login"
                    className="flex flex-col items-center justify-center gap-1.5 flex-1 py-2 px-2 rounded-xl transition-all duration-200 text-white/70 hover:text-white hover:bg-white/5"
                    aria-label="Login"
                  >
                    <div className="transition-transform duration-200">
                      {item.icon}
                    </div>
                    <span className="text-[10px] sm:text-xs font-semibold tracking-wide transition-colors text-white/70">
                      Login
                    </span>
                  </Link>
                );
              }
              
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex flex-col items-center justify-center gap-1.5 flex-1 py-2 px-2 rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-white/15 text-white scale-105"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  }`}
                  aria-label={item.label}
                >
                  <div
                    className={`transition-transform duration-200 ${
                      isActive ? "scale-110" : ""
                    }`}
                  >
                    {item.icon}
                  </div>
                  <span
                    className={`text-[10px] sm:text-xs font-semibold tracking-wide transition-colors ${
                      isActive ? "text-white" : "text-white/70"
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useState, useEffect, useRef } from "react";
import { Home, UtensilsCrossed, Truck, Receipt, User, Package } from "lucide-react";

const NAV_HEIGHT = 64;

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  /** Link real (ex: /login când user nelogat) */
  resolveHref?: (isAuthenticated: boolean) => string;
  resolveLabel?: (isAuthenticated: boolean) => string;
};

const navItems: NavItem[] = [
  { label: "Home", href: "/", icon: Home },
  { label: "Meniu", href: "/jester-24-24", icon: UtensilsCrossed },
  { label: "Delivery", href: "/delivery", icon: Truck },
  { label: "Comenzi", href: "/orders", icon: Receipt },
  {
    label: "Profil",
    href: "/profile",
    icon: User,
    resolveHref: (auth) => (auth ? "/profile" : "/login"),
    resolveLabel: (auth) => (auth ? "Profil" : "Login"),
  },
];

/** Rute care contează ca "Meniu" activ (catalog / categorii). */
const MENU_PATH_PREFIXES = ["/jester-24-24", "/pizza", "/grill", "/bake", "/supply", "/antiq"];

/** Rute pe care bottom nav este ascuns complet (formulare / checkout / auth). */

const HIDE_NAV_PATHNAMES: string[] = [
  "/jester-24-24/checkout",
  "/login",
  "/register",
  "/profile/edit",
  "/delivery",
];
function shouldHideNav(pathname: string): boolean {
  if (HIDE_NAV_PATHNAMES.some((p) => pathname === p)) return true;
  if (pathname.startsWith("/addresses")) return true;
  return false;
}

type BottomNavigationProps = {
  hideOnScrollDown?: boolean;
};

/**
 * BottomNavigation – icon + label per tab, lucide-react, height fix, safe-area.
 * Active: accent (amber) + bold; inactiv: gri soft. Micro-animație scale(1.1) la activ.
 */
export default function BottomNavigation({
  hideOnScrollDown = false,
}: BottomNavigationProps = {}) {
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuthStore();
  const showCourier = user?.role === "COURIER" || user?.role === "ADMIN";
  const items = [
    ...navItems,
    ...(showCourier ? [{ label: "Curier", href: "/courier", icon: Package }] : []),
  ];
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  const forceHiddenRoute = shouldHideNav(pathname ?? "");

  useEffect(() => {
    if (!hideOnScrollDown || forceHiddenRoute) return;
    const SCROLL_THRESHOLD = 8;
    const handleScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        const y = window.scrollY ?? window.pageYOffset;
        if (y <= 0) setVisible(true);
        else if (y > lastScrollY.current && y - lastScrollY.current > SCROLL_THRESHOLD) setVisible(false);
        else if (lastScrollY.current - y > SCROLL_THRESHOLD) setVisible(true);
        lastScrollY.current = y;
        ticking.current = false;
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hideOnScrollDown, forceHiddenRoute]);

  const isHidden = hideOnScrollDown && !visible;

  if (forceHiddenRoute) return null;

  return (
    <nav
      className={`fixed inset-x-0 bottom-0 z-50 transition-all duration-300 ease-out ${
        isHidden ? "translate-y-full opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
      <div
        className="border-t border-white/10 bg-[#0a0a12] pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      >
        <div
          className="mx-auto flex max-w-lg items-stretch justify-around px-2"
          style={{ height: NAV_HEIGHT }}
        >
          {items.map((item) => {
            const href = item.resolveHref ? item.resolveHref(isAuthenticated) : item.href;
            const label = item.resolveLabel ? item.resolveLabel(isAuthenticated) : item.label;
            const isMenuActive =
              item.href === "/jester-24-24" &&
              pathname !== "/jester-24-24/checkout" &&
              MENU_PATH_PREFIXES.some((p) => pathname === p || (pathname?.startsWith(p + "/") ?? false));
            const isCourierActive = item.href === "/courier" && (pathname === "/courier" || (pathname?.startsWith?.("/courier/") ?? false));
            const isActive = pathname === href || isMenuActive || isCourierActive;

            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={href}
                className="flex flex-1 flex-col items-center justify-center gap-0.5 rounded-lg transition-colors duration-200 hover:bg-white/5 active:bg-white/10"
                aria-label={label}
              >
                <div
                  className={`flex items-center justify-center transition-all duration-200 ease-out ${
                    isActive ? "scale-110 opacity-100" : "scale-100 opacity-80"
                  }`}
                >
                  <Icon
                    className={isActive ? "text-amber-400" : "text-white/50"}
                    size={22}
                  />
                </div>
                <span
                  className={`text-[10px] font-medium tracking-wide transition-colors duration-200 ${
                    isActive ? "font-bold text-amber-400" : "text-white/50"
                  }`}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

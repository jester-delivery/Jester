"use client";

import { useEffect, useState } from "react";
import { useJester24CartStore } from "@/stores/jester24CartStore";
import BottomNavigation from "@/components/ui/BottomNavigation";
import CheckoutBar from "@/components/jester24/CheckoutBar";

type Jester24BottomBarSwitcherProps = {
  onCheckoutClick: () => void;
};

/**
 * Pe pagina Jester 24/24: dacă coșul are items, arată CheckoutBar;
 * altfel arată BottomNavigation. Tranziție smooth la schimbare.
 * total/hasItems folosite doar după mount ca să evităm hydration (store/localStorage).
 */
export default function Jester24BottomBarSwitcher({
  onCheckoutClick,
}: Jester24BottomBarSwitcherProps) {
  const [mounted, setMounted] = useState(false);
  const items = useJester24CartStore((s) => s.items);
  const getTotalPrice = useJester24CartStore((s) => s.getTotalPrice);

  useEffect(() => {
    setMounted(true);
  }, []);

  const hasItems = mounted && items.length > 0;
  const total = mounted ? getTotalPrice() : 0;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 overflow-hidden">
      {/* Nav: vizibil când coșul e gol, cu tranziție */}
      <div
        className={`absolute inset-x-0 bottom-0 transition-opacity duration-300 ease-out ${
          hasItems ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
        aria-hidden={hasItems}
      >
        <BottomNavigation hideOnScrollDown />
      </div>
      {/* Checkout bar: vizibil când coșul are items (după mount) */}
      <div
        className={`absolute inset-x-0 bottom-0 transition-opacity duration-300 ease-out ${
          hasItems ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!hasItems}
      >
        <CheckoutBar total={total} onCheckoutClick={onCheckoutClick} />
      </div>
    </div>
  );
}

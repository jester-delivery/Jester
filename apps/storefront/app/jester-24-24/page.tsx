"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Jester24BottomBarSwitcher from "@/components/jester24/Jester24BottomBarSwitcher";
import ProductRow from "@/components/ui/ProductRow";
import Toast from "@/components/ui/Toast";
import CartDrawer from "@/components/jester24/CartDrawer";
import CartHeaderButton from "@/components/jester24/CartHeaderButton";
import FlyToCart from "@/components/jester24/FlyToCart";
import { useJester24CartStore } from "@/stores/jester24CartStore";
import { JESTER24_CATEGORIES } from "@/lib/data/jester24-products";

const TOAST_DURATION_MS = 2500;
const DEFAULT_IMAGE = "https://i.imgur.com/W5X0s4C.jpeg";

export default function Jester2424Page() {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [flyState, setFlyState] = useState<{ from: DOMRect; image: string } | null>(null);
  const [bounceTrigger, setBounceTrigger] = useState(0);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cartButtonRef = useRef<HTMLButtonElement>(null);

  const items = useJester24CartStore((s) => s.items);

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, TOAST_DURATION_MS);
  }, []);

  useEffect(() => () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
  }, []);

  const redirectToCheckout = useCallback(() => {
    if (items.length === 0) return;
    setDrawerOpen(false);
    router.push("/jester-24-24/checkout");
  }, [items.length, router]);

  return (
    <main className="min-h-screen text-white bg-gradient-to-b from-[#050610] via-[#040411] to-[#050610] pb-24">
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#050610]/90 backdrop-blur-md safe-area-inset-top">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 pt-4 pb-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              Jester 24/24
            </h1>
            <p className="mt-0.5 text-sm text-white/70">Snacks, băuturi, țigări și accesorii</p>
          </div>
          <div className="shrink-0 pl-2">
            <CartHeaderButton
              ref={cartButtonRef}
              onClick={() => setDrawerOpen(true)}
              bounceTrigger={bounceTrigger}
            />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-6 space-y-10">
        {JESTER24_CATEGORIES.map((category) => (
          <section key={category.id}>
            <h2 className="text-lg font-semibold text-white/90 mb-3 border-b border-white/10 pb-2">
              {category.label}
            </h2>
            <div className="flex flex-col gap-3">
              {category.products.map((product) => (
                <ProductRow
                  key={product.id}
                  id={product.id}
                  section={category.slug}
                  name={product.name}
                  price={product.price}
                  image={product.image ?? DEFAULT_IMAGE}
                  isAvailable={true}
                  restricted18={product.restricted18}
                  showToast={showToast}
                  onAddWithFly={(fromRect, imageUrl) =>
                    setFlyState({ from: fromRect, image: imageUrl })
                  }
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {flyState && (
        <FlyToCart
          fromRect={flyState.from}
          imageUrl={flyState.image}
          cartRef={cartButtonRef}
          onComplete={() => {
            setFlyState(null);
            setBounceTrigger((t) => t + 1);
          }}
        />
      )}
      <CartDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onCheckout={redirectToCheckout}
        showToast={showToast}
      />
      <Toast message={toastMessage} />
      <Jester24BottomBarSwitcher onCheckoutClick={redirectToCheckout} />
    </main>
  );
}

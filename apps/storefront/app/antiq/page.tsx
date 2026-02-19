"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import ProductRow from "@/components/ui/ProductRow";
import Toast from "@/components/ui/Toast";
import CartDrawer from "@/components/jester24/CartDrawer";
import CartHeaderButton from "@/components/jester24/CartHeaderButton";
import FlyToCart from "@/components/jester24/FlyToCart";
import Jester24BottomBarSwitcher from "@/components/jester24/Jester24BottomBarSwitcher";
import { useCategory } from "@/lib/useCategory";
import { useJester24CartStore } from "@/stores/jester24CartStore";

const ANTIQ_HEADER_IMAGE = "https://i.imgur.com/W5X0s4C.jpeg";
const TOAST_DURATION_MS = 2500;
const SECTION_ANTIQ = "antiq";
const DEFAULT_IMAGE = "https://i.imgur.com/W5X0s4C.jpeg";

export default function AntiqPage() {
  const router = useRouter();
  const { products, loading, error } = useCategory("antiq");
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
    <main className="min-h-screen overflow-x-hidden text-white bg-gradient-to-b from-[#050610] via-[#040411] to-[#050610] pb-24">
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#050610]/90 backdrop-blur-md safe-area-inset-top">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 pt-4 pb-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">ANTIQ</h1>
            <p className="mt-0.5 text-sm text-white/70">
              Suveniruri, amintiri și lucruri pe care le cumperi doar în vacanță.
            </p>
          </div>
          <div className="shrink-0 pl-2">
            <CartHeaderButton
              ref={cartButtonRef}
              onClick={() => setDrawerOpen(true)}
              bounceTrigger={bounceTrigger}
            />
          </div>
        </div>
        <div className="mx-auto max-w-4xl px-4 pb-4">
          <div className="relative h-32 w-full overflow-hidden rounded-2xl border border-white/20 bg-white/10 sm:h-40">
            <Image
              src={ANTIQ_HEADER_IMAGE}
              alt="ANTIQ Suveniruri"
              fill
              className="object-cover"
              priority
              sizes="(max-width: 640px) 100vw, 896px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {loading && <p className="text-white/70">Se încarcă produsele...</p>}
        {error && <p className="text-red-300">{error}</p>}
        {!loading && !error && products.length === 0 && (
          <p className="text-white/70">Niciun produs momentan.</p>
        )}
        {!loading && !error && products.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductRow
                key={product.id}
                id={product.id}
                section={SECTION_ANTIQ}
                name={product.name}
                description={product.description ?? undefined}
                price={Number(product.price)}
                image={product.image ?? DEFAULT_IMAGE}
                isAvailable={product.isAvailable}
                showToast={showToast}
                onAddWithFly={(fromRect, imageUrl) => setFlyState({ from: fromRect, image: imageUrl })}
              />
            ))}
          </div>
        )}
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

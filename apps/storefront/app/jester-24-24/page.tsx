"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Jester24BottomBarSwitcher from "@/components/jester24/Jester24BottomBarSwitcher";
import ProductRow from "@/components/ui/ProductRow";
import Toast from "@/components/ui/Toast";
import CartDrawer from "@/components/jester24/CartDrawer";
import CartHeaderButton from "@/components/jester24/CartHeaderButton";
import FlyToCart from "@/components/jester24/FlyToCart";
import { JESTER24_CATEGORIES } from "@/lib/data/jester24-products";
import { api } from "@/lib/api";
import { useJester24CartStore } from "@/stores/jester24CartStore";

const HEADER_HEIGHT = 140;
const TAB_IMAGE = "https://i.imgur.com/W5X0s4C.jpeg";

const TOAST_DURATION_MS = 2500;

export default function Jester2424Page() {
  const router = useRouter();
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const [activeTab, setActiveTab] = useState<string>(JESTER24_CATEGORIES[0].id);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [flyState, setFlyState] = useState<{ from: DOMRect; image: string } | null>(null);
  const [bounceTrigger, setBounceTrigger] = useState(0);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cartButtonRef = useRef<HTMLButtonElement>(null);

  const items = useJester24CartStore((s) => s.items);
  const getTotalPrice = useJester24CartStore((s) => s.getTotalPrice);
  const clearCart = useJester24CartStore((s) => s.clear);

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

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.getAttribute("data-section");
          if (id) setActiveTab(id);
        });
      },
      {
        rootMargin: `-${HEADER_HEIGHT}px 0px -60% 0px`,
        threshold: [0, 0.25, 0.5],
      }
    );

    JESTER24_CATEGORIES.forEach((c) => {
      const el = sectionRefs.current[c.id];
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    const el = sectionRefs.current[id];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const redirectToCheckout = useCallback(() => {
    if (items.length === 0) return;
    setDrawerOpen(false);
    router.push("/jester-24-24/checkout");
  }, [items.length, router]);

  return (
    <main className="min-h-screen text-white bg-gradient-to-b from-[#050610] via-[#040411] to-[#050610] pb-24">
      {/* Sticky Header + Tabs + Cart (dreapta sus) */}
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#050610]/90 backdrop-blur-md safe-area-inset-top">
        <div className="mx-auto flex max-w-4xl items-start justify-between gap-3 px-4 pt-4 pb-1">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              Jester 24/24
            </h1>

            <nav
              className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
              aria-label="Categorii"
            >
              {JESTER24_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => scrollToSection(cat.id)}
                  className={`flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-base font-semibold transition-all duration-200 sm:px-5 sm:py-3.5 sm:text-lg ${
                    activeTab === cat.id
                      ? "bg-white/15 text-white"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg ring-1 ring-white/20">
                    <Image
                      src={TAB_IMAGE}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  </span>
                  {cat.label}
                </button>
              ))}
            </nav>
          </div>
          <div className="shrink-0 pt-1 pl-2 sm:pl-0">
            <CartHeaderButton
              ref={cartButtonRef}
              onClick={() => setDrawerOpen(true)}
              bounceTrigger={bounceTrigger}
            />
          </div>
        </div>
      </header>

      {/* Secțiuni: listă verticală, un produs per rând */}
      <div className="mx-auto max-w-4xl px-4 py-6">
        {JESTER24_CATEGORIES.map((category) => (
          <section
            key={category.id}
            ref={(el) => {
              sectionRefs.current[category.id] = el;
            }}
            data-section={category.id}
            id={category.id}
            className="scroll-mt-36 py-8"
          >
            <div className="mb-6 flex items-center gap-4">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl ring-2 ring-white/20">
                <Image
                  src={category.image}
                  alt={category.label}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>
              <h2 className="text-2xl font-bold text-white">{category.label}</h2>
            </div>

            <div className="flex flex-col gap-3">
              {category.products.map((product) => (
                <ProductRow
                  key={product.id}
                  id={product.id}
                  section={category.id}
                  name={product.name}
                  price={product.price}
                  image={product.image}
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

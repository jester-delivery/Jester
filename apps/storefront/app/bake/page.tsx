"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import ProductRow from "@/components/ui/ProductRow";
import Toast from "@/components/ui/Toast";
import CartDrawer from "@/components/jester24/CartDrawer";
import CartHeaderButton from "@/components/jester24/CartHeaderButton";
import Jester24BottomBarSwitcher from "@/components/jester24/Jester24BottomBarSwitcher";
import { BAKE_CATEGORIES } from "@/lib/data/bake-products";
import { useJester24CartStore } from "@/stores/jester24CartStore";

const HEADER_HEIGHT = 240;
const BAKE_HEADER_IMAGE = "https://i.imgur.com/W5X0s4C.jpeg";
const TOAST_DURATION_MS = 2500;

export default function BakePage() {
  const router = useRouter();
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const [activeTab, setActiveTab] = useState<string>(BAKE_CATEGORIES[0].id);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    BAKE_CATEGORIES.forEach((c) => {
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
      {/* Sticky Header: titlu + imagine + categorii + cart */}
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#050610]/90 backdrop-blur-md safe-area-inset-top">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 pt-4 pb-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Bake</h1>
            <p className="mt-0.5 text-sm text-white/70">Brutărie & Desert</p>
          </div>
          <div className="shrink-0 pl-2">
            <CartHeaderButton onClick={() => setDrawerOpen(true)} />
          </div>
        </div>
        <div className="mx-auto max-w-4xl px-4 pb-3">
          <div className="relative h-28 w-full overflow-hidden rounded-2xl border border-white/20 bg-white/10 sm:h-36">
            <Image
              src={BAKE_HEADER_IMAGE}
              alt="Bake"
              fill
              className="object-cover"
              priority
              sizes="(max-width: 640px) 100vw, 896px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
        </div>
        <nav
          className="mx-auto max-w-4xl flex gap-2 overflow-x-auto px-4 pb-3 scrollbar-hide"
          aria-label="Categorii"
        >
          {BAKE_CATEGORIES.map((cat) => (
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
                  src={cat.image}
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
      </header>

      {/* Secțiuni: Brutărie, Desert – scroll-sync cu tabs */}
      <div className="mx-auto max-w-4xl px-4 py-6">
        {BAKE_CATEGORIES.map((category) => (
          <section
            key={category.id}
            ref={(el) => {
              sectionRefs.current[category.id] = el;
            }}
            data-section={category.id}
            id={category.id}
            className="scroll-mt-[240px] py-8"
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
                  description={product.description}
                  price={product.price}
                  image={product.image}
                  showToast={showToast}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

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

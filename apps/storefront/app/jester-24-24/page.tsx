"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Jester24BottomBarSwitcher from "@/components/jester24/Jester24BottomBarSwitcher";
import ProductRow from "@/components/ui/ProductRow";
import Toast from "@/components/ui/Toast";
import CartDrawer from "@/components/jester24/CartDrawer";
import CartHeaderButton from "@/components/jester24/CartHeaderButton";
import FlyToCart from "@/components/jester24/FlyToCart";
import ImagePreviewModal from "@/components/jester24/ImagePreviewModal";
import { useJester24CartStore } from "@/stores/jester24CartStore";
import { JESTER24_CATEGORIES } from "@/lib/data/jester24-products";

const TOAST_DURATION_MS = 2500;
const DEFAULT_IMAGE = "https://i.imgur.com/W5X0s4C.jpeg";
const JESTER24_HEADER_IMAGE = "https://i.imgur.com/W5X0s4C.jpeg";

export default function Jester2424Page() {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [flyState, setFlyState] = useState<{ from: DOMRect; image: string } | null>(null);
  const [bounceTrigger, setBounceTrigger] = useState(0);
  const [imagePreview, setImagePreview] = useState<{ imageUrl: string; title: string } | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string>(JESTER24_CATEGORIES[0]?.id ?? "snacks");
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cartButtonRef = useRef<HTMLButtonElement>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const items = useJester24CartStore((s) => s.items);

  const scrollToCategory = useCallback((categoryId: string) => {
    setActiveCategoryId(categoryId);
    const el = sectionRefs.current[categoryId];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

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
    const sections = JESTER24_CATEGORIES.map((c) => sectionRefs.current[c.id]).filter(Boolean) as HTMLDivElement[];
    if (sections.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const id = (entry.target as HTMLDivElement).id;
          if (id) setActiveCategoryId(id);
          break;
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );
    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
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
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Jester 24/24</h1>
            <p className="mt-0.5 text-sm text-white/70">Alege și adaugă în coș</p>
          </div>
          <div className="shrink-0 pl-2">
            <CartHeaderButton
              ref={cartButtonRef}
              onClick={() => setDrawerOpen(true)}
              bounceTrigger={bounceTrigger}
            />
          </div>
        </div>
        <div className="mx-auto max-w-4xl px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto pb-1 scroll-smooth" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
            {JESTER24_CATEGORIES.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => scrollToCategory(category.id)}
                className={`
                  shrink-0 rounded-full px-4 py-2 text-sm font-medium transition
                  ${activeCategoryId === category.id
                    ? "bg-amber-500 text-black"
                    : "bg-white/10 text-white/90 hover:bg-white/20"
                  }
                `}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mx-auto max-w-4xl px-4 pb-4">
          <div className="relative h-32 w-full overflow-hidden rounded-2xl border border-white/20 bg-white/10 sm:h-40">
            <Image
              src={JESTER24_HEADER_IMAGE}
              alt="Jester 24/24"
              fill
              className="object-cover"
              priority
              sizes="(max-width: 640px) 100vw, 896px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-6 space-y-10">
        {JESTER24_CATEGORIES.map((category) => (
          <section
            key={category.id}
            ref={(el) => { sectionRefs.current[category.id] = el; }}
            id={category.id}
            className="scroll-mt-44"
          >
            <h2 className="text-lg font-semibold text-white/90 mb-3 border-b border-white/10 pb-2">
              {category.label}
            </h2>
            <div className="flex flex-col gap-4">
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
                  onImagePreview={(imageUrl, title) =>
                    setImagePreview({ imageUrl, title })
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
      {imagePreview && (
        <ImagePreviewModal
          key={`${imagePreview.imageUrl}-${imagePreview.title}`}
          open={!!imagePreview}
          onClose={() => setImagePreview(null)}
          imageUrl={imagePreview.imageUrl}
          title={imagePreview.title}
        />
      )}
      <Toast message={toastMessage} />
      <Jester24BottomBarSwitcher onCheckoutClick={redirectToCheckout} />
    </main>
  );
}

"use client";

// Flow food: PENDING → CONFIRMED → PREPARING → ON_THE_WAY → DELIVERED
const STEPS_FOOD: { status: string; label: string }[] = [
  { status: "PENDING", label: "Plasată" },
  { status: "CONFIRMED", label: "Acceptată" },
  { status: "PREPARING", label: "Se pregătește" },
  { status: "ON_THE_WAY", label: "În drum" },
  { status: "DELIVERED", label: "Livrată" },
];

// Flow Jester Delivery (pachete): Plasată → Acceptată → Ridicată de curier → Livrată
const STEPS_PACKAGE: { status: string; label: string }[] = [
  { status: "PENDING", label: "Plasată" },
  { status: "CONFIRMED", label: "Acceptată" },
  { status: "PREPARING", label: "Ridicată de curier" },
  { status: "DELIVERED", label: "Livrată" },
];

function stepIndexFood(status: string): number {
  if (status === "OUT_FOR_DELIVERY" || status === "ON_THE_WAY") return 3;
  const i = STEPS_FOOD.findIndex((s) => s.status === status);
  return i >= 0 ? i : -1;
}

function stepIndexPackage(status: string): number {
  if (status === "ON_THE_WAY" || status === "OUT_FOR_DELIVERY" || status === "PREPARING" || status === "READY" || status === "DELIVERING") return 2;
  const i = STEPS_PACKAGE.findIndex((s) => s.status === status);
  return i >= 0 ? i : -1;
}

type Props = { status: string; orderType?: "product_order" | "package_delivery" };

export default function OrderStatusTimeline({ status, orderType }: Props) {
  const isPackage = orderType === "package_delivery";
  const STEPS = isPackage ? STEPS_PACKAGE : STEPS_FOOD;
  const currentIdx = isPackage ? stepIndexPackage(status) : stepIndexFood(status);
  const canceled = status === "CANCELED" || status === "CANCELLED";

  return (
    <div className="mt-6 rounded-2xl border border-white/20 bg-white/5 p-4">
      <p className="mb-4 text-sm font-semibold text-white/80">Status comandă</p>
      {canceled ? (
        <p className="text-red-300">Comanda a fost anulată.</p>
      ) : (
        <div className="relative flex">
          {/* linie de fundal */}
          <div className="absolute left-4 right-4 top-5 h-0.5 bg-white/20" />
          <div
            className="absolute left-4 top-5 h-0.5 bg-amber-500 transition-all duration-500"
            style={{
              width:
                currentIdx >= 0
                  ? `calc((100% - 2rem) * ${currentIdx / (STEPS.length - 1)})`
                  : 0,
            }}
          />
          {STEPS.map((step, i) => {
            const isActive = currentIdx >= i;
            return (
              <div key={step.status} className="relative z-10 flex flex-1 flex-col items-center">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                    isActive ? "bg-amber-500 text-black" : "bg-white/20 text-white/60"
                  }`}
                >
                  {i + 1}
                </div>
                <span
                  className={`mt-2 max-w-[4rem] text-center text-xs font-medium ${
                    isActive ? "text-amber-300" : "text-white/50"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

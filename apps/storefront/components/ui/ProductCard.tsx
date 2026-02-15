"use client";

import Image from "next/image";

type ProductCardProps = {
  name: string;
  price: number;
  image: string;
  restricted18?: boolean;
};

/**
 * Card simplu pentru produs: imagine, nume, preț, opțional badge +18
 */
export default function ProductCard({
  name,
  price,
  image,
  restricted18,
}: ProductCardProps) {
  return (
    <div className="group relative flex flex-col rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 overflow-hidden transition-all duration-200 hover:bg-white/15 hover:border-white/30 hover:shadow-lg">
      {/* +18 badge */}
      {restricted18 && (
        <div className="absolute top-2 right-2 z-10 rounded-lg bg-amber-500/95 px-2 py-1 text-[10px] font-bold text-black shadow-md">
          +18
        </div>
      )}

      {/* Image */}
      <div className="relative aspect-square w-full overflow-hidden">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col justify-between p-3">
        <h3 className="text-sm font-semibold text-white line-clamp-2">{name}</h3>
        <p className="mt-2 text-base font-bold text-white">
          {price.toFixed(2)} <span className="text-xs font-normal text-white/70">lei</span>
        </p>
      </div>
    </div>
  );
}

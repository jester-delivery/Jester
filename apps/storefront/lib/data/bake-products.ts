/**
 * Bake – Brutărie & Desert. Același pattern ca Jester 24/24 (categorii + produse).
 * section = category.id pentru coșul global.
 */

const BAKE_IMAGE = "https://i.imgur.com/W5X0s4C.jpeg";

export type BakeProduct = {
  id: string;
  name: string;
  description?: string;
  price: number;
  image: string;
};

export type BakeCategory = {
  id: string;
  label: string;
  image: string;
  products: BakeProduct[];
};

export const BAKE_CATEGORIES: BakeCategory[] = [
  {
    id: "brutarie",
    label: "Brutărie",
    image: BAKE_IMAGE,
    products: [
      { id: "b1", name: "Franzelă clasică", description: "Pâine albă, crocantă", price: 8, image: BAKE_IMAGE },
      { id: "b2", name: "Baghetă albă", description: "Fransuză, crocantă la exterior", price: 6, image: BAKE_IMAGE },
      { id: "b3", name: "Baghetă cu semințe", description: "Semințe de susan și floarea-soarelui", price: 7, image: BAKE_IMAGE },
      { id: "b4", name: "Pâine țărănească", description: "Rotundă, coajă groasă", price: 10, image: BAKE_IMAGE },
      { id: "b5", name: "Pâine integrală", description: "Făină integrală, fibre", price: 9, image: BAKE_IMAGE },
      { id: "b6", name: "Chiflă burger", description: "Pentru burgeri, cu susan", price: 4, image: BAKE_IMAGE },
      { id: "b7", name: "Lipie / Pita", description: "Lipie moale, pentru wrap", price: 5, image: BAKE_IMAGE },
      { id: "b8", name: "Covrig cu sare", description: "Covrig clasic, sare mare", price: 5, image: BAKE_IMAGE },
      { id: "b9", name: "Focaccia cu rozmarin", description: "Pâine italiană, rozmarin, ulei", price: 14, image: BAKE_IMAGE },
    ],
  },
  {
    id: "desert",
    label: "Desert",
    image: BAKE_IMAGE,
    products: [
      { id: "d1", name: "Tiramisu", description: "Mascarpone, cafea, cacao", price: 22, image: BAKE_IMAGE },
      { id: "d2", name: "Cheesecake", description: "New York style, fructe de pădure", price: 24, image: BAKE_IMAGE },
      { id: "d3", name: "Clătite cu ciocolată", description: "3 bucăți, sos de ciocolată", price: 18, image: BAKE_IMAGE },
      { id: "d4", name: "Papanași", description: "2 bucăți, smântână, dulceață", price: 26, image: BAKE_IMAGE },
      { id: "d5", name: "Lava cake", description: "Ciocolată topită, înghețată vanilie", price: 28, image: BAKE_IMAGE },
      { id: "d6", name: "Înghețată (2 cupe)", description: "Vanilie și ciocolată", price: 16, image: BAKE_IMAGE },
    ],
  },
];

/**
 * Date pentru pagina Jester 24/24
 * Categorii: Snacks, Băuturi, Țigări și Accesorii
 */

const CATEGORY_IMAGE = "https://i.imgur.com/W5X0s4C.jpeg";

export type Jester24Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  restricted18?: boolean;
};

export type Jester24Category = {
  id: string;
  slug: string;
  label: string;
  image: string;
  products: Jester24Product[];
};

export const JESTER24_CATEGORIES: Jester24Category[] = [
  {
    id: "snacks",
    slug: "snacks",
    label: "Gustări",
    image: CATEGORY_IMAGE,
    products: [
      { id: "s1", name: "Peperoni", price: 12, image: CATEGORY_IMAGE },
      { id: "s2", name: "Carpathian Jerky", price: 18, image: CATEGORY_IMAGE },
      { id: "s3", name: "Chio Chips", price: 8, image: CATEGORY_IMAGE },
      { id: "s4", name: "Toblerone", price: 15, image: CATEGORY_IMAGE },
      { id: "s5", name: "Semințe", price: 5, image: CATEGORY_IMAGE },
      { id: "s6", name: "Twix", price: 7, image: CATEGORY_IMAGE },
      { id: "s7", name: "Mars", price: 7, image: CATEGORY_IMAGE },
      { id: "s8", name: "Skittles", price: 9, image: CATEGORY_IMAGE },
      { id: "s9", name: "Pringles", price: 14, image: CATEGORY_IMAGE },
      { id: "s10", name: "Kinder Bueno", price: 11, image: CATEGORY_IMAGE },
    ],
  },
  {
    id: "drinks",
    slug: "drinks",
    label: "Băuturi",
    image: CATEGORY_IMAGE,
    products: [
      { id: "d1", name: "Pepsi", price: 6, image: CATEGORY_IMAGE },
      { id: "d2", name: "Fanta", price: 6, image: CATEGORY_IMAGE },
      { id: "d3", name: "Sprite", price: 6, image: CATEGORY_IMAGE },
      { id: "d4", name: "Apă plată", price: 4, image: CATEGORY_IMAGE },
      { id: "d5", name: "Apă carbogazoasă", price: 4, image: CATEGORY_IMAGE },
      { id: "d6", name: "Heineken", price: 10, image: CATEGORY_IMAGE, restricted18: true },
      { id: "d7", name: "Timișoreana", price: 8, image: CATEGORY_IMAGE, restricted18: true },
      { id: "d8", name: "Fetească regală sec", price: 45, image: CATEGORY_IMAGE, restricted18: true },
      { id: "d9", name: "Vodka Absolut", price: 85, image: CATEGORY_IMAGE, restricted18: true },
      { id: "d10", name: "Whiskey Jameson", price: 120, image: CATEGORY_IMAGE, restricted18: true },
    ],
  },
  {
    id: "tobacco",
    slug: "tobacco",
    label: "Țigări și Accesorii",
    image: CATEGORY_IMAGE,
    products: [
      { id: "t1", name: "Kent Classic", price: 28, image: CATEGORY_IMAGE, restricted18: true },
      { id: "t2", name: "Dunhill", price: 35, image: CATEGORY_IMAGE, restricted18: true },
      { id: "t3", name: "Pall Mall", price: 26, image: CATEGORY_IMAGE, restricted18: true },
      { id: "t4", name: "OCB", price: 12, image: CATEGORY_IMAGE, restricted18: true },
      { id: "t5", name: "Filtre", price: 8, image: CATEGORY_IMAGE, restricted18: true },
    ],
  },
];

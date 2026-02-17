/**
 * Produse Pizza – același pattern ca Jester 24/24 (id, name, price, image; optional description).
 * section = "pizza" pentru coșul global.
 */

const PIZZA_IMAGE = "https://i.imgur.com/W5X0s4C.jpeg";

export type PizzaProduct = {
  id: string;
  name: string;
  description?: string;
  price: number;
  image: string;
};

export const PIZZA_PRODUCTS: PizzaProduct[] = [
  { id: "p1", name: "Margherita", description: "Roșii, mozzarella, busuioc", price: 28, image: PIZZA_IMAGE },
  { id: "p2", name: "Peperoni", description: "Salam picant, mozzarella, roșii", price: 32, image: PIZZA_IMAGE },
  { id: "p3", name: "Quattro Formaggi", description: "Mozzarella, gorgonzola, parmezan, telemea", price: 35, image: PIZZA_IMAGE },
  { id: "p4", name: "Capricciosa", description: "Șuncă, ciuperci, măsline, artichoc", price: 34, image: PIZZA_IMAGE },
  { id: "p5", name: "Diavola", description: "Salam picant, roșii, mozzarella", price: 33, image: PIZZA_IMAGE },
  { id: "p6", name: "Hawaiian", description: "Șuncă, ananas, mozzarella", price: 31, image: PIZZA_IMAGE },
  { id: "p7", name: "Vegetariană", description: "Legume de sezon, mozzarella, roșii", price: 30, image: PIZZA_IMAGE },
  { id: "p8", name: "Carbonara", description: "Bacon, smântână, ou, parmezan", price: 36, image: PIZZA_IMAGE },
  { id: "p9", name: "Tuna", description: "Ton, ceapă roșie, măsline, mozzarella", price: 34, image: PIZZA_IMAGE },
  { id: "p10", name: "Prosciutto e Rucola", description: "Prosciutto, rucola, parmezan, mozzarella", price: 38, image: PIZZA_IMAGE },
];

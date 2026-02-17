/**
 * Produse Grill – același pattern ca /pizza (id, name, description, price, image).
 * section = "grill" pentru coșul global.
 */

const GRILL_IMAGE = "https://i.imgur.com/W5X0s4C.jpeg";

export type GrillProduct = {
  id: string;
  name: string;
  description?: string;
  price: number;
  image: string;
};

export const GRILL_PRODUCTS: GrillProduct[] = [
  { id: "g1", name: "Ceafă de porc la grătar", description: "Servită cu cartofi prăjiți și salată", price: 42, image: GRILL_IMAGE },
  { id: "g2", name: "Piept de pui la grătar", description: "Cu orez și legume de sezon", price: 38, image: GRILL_IMAGE },
  { id: "g3", name: "Mici (porție 4 bucăți)", description: "Serviți cu muștar, pâine și cartofi", price: 28, image: GRILL_IMAGE },
  { id: "g4", name: "Cârnați de casă la grătar", description: "Porție 3 bucăți, cartofi și murături", price: 35, image: GRILL_IMAGE },
  { id: "g5", name: "Steak de vită", description: "Grătar, cartofi copți și sos de vin", price: 65, image: GRILL_IMAGE },
  { id: "g6", name: "File de pește la grătar", description: "Cu orez și lămâie", price: 48, image: GRILL_IMAGE },
  { id: "g7", name: "Cotlet de porc la grătar", description: "Servit cu cartofi prăjiți și salată", price: 40, image: GRILL_IMAGE },
  { id: "g8", name: "Frigărui mixte", description: "Pui, porc, legume la grătar", price: 45, image: GRILL_IMAGE },
  { id: "g9", name: "Aripioare picante la grătar", description: "Porție 6 bucăți, sos BBQ, cartofi", price: 36, image: GRILL_IMAGE },
  { id: "g10", name: "Burger beef la grătar", description: "Chiftea, brânză, salată, cartofi prăjiți", price: 39, image: GRILL_IMAGE },
];

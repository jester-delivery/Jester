/**
 * Taxe livrare – separate clar.
 * Produse (Pizza, Grill, Bake, Supply, Antiq): 7 lei.
 * Jester Delivery (pachet): 10 lei, până la 20 kg.
 */
const PRODUCT_DELIVERY_FEE = Number(process.env.PRODUCT_DELIVERY_FEE) || 7;
const PACKAGE_DELIVERY_FEE = Number(process.env.PACKAGE_DELIVERY_FEE) || 10;

/**
 * TVA 19% – informativ. Prețurile din DB sunt TVA inclus.
 */
const VAT_RATE = Number(process.env.VAT_RATE) || 0.19;

module.exports = {
  PRODUCT_DELIVERY_FEE,
  PACKAGE_DELIVERY_FEE,
  VAT_RATE,
};

/**
 * Supply – Supe & Ciorbe. Același pattern ca Pizza (id, name, price, image; optional description).
 * section = "supply" pentru coșul global.
 */

const SUPPLY_IMAGE = "https://i.imgur.com/W5X0s4C.jpeg";

export type SupplyProduct = {
  id: string;
  name: string;
  description?: string;
  price: number;
  image: string;
};

export const SUPPLY_PRODUCTS: SupplyProduct[] = [
  { id: "s1", name: "Ciorbă de burtă", description: "Clasică, cu smântână și pătrunjel", price: 22, image: SUPPLY_IMAGE },
  { id: "s2", name: "Ciorbă de văcuță", description: "Văcuță, legume, borș", price: 20, image: SUPPLY_IMAGE },
  { id: "s3", name: "Storceac de sturion", description: "Sturion Delta, legume, lămâie", price: 35, image: SUPPLY_IMAGE },
  { id: "s4", name: "Ciorbă de perișoare", description: "Perișoare de casă, borș", price: 18, image: SUPPLY_IMAGE },
  { id: "s5", name: "Ciorbă rădăuțeană", description: "Rădăuțeană autentică, smântână", price: 24, image: SUPPLY_IMAGE },
];

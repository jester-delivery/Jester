const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.restaurant.deleteMany();
  // NU ștergem userii – păstrăm conturile existente pentru login
  // await prisma.user.deleteMany();

  // Utilizator default doar dacă nu există niciun user (pentru prima rulare / DB goală)
  const userCount = await prisma.user.count();
  if (userCount === 0) {
    const defaultPasswordHash = await bcrypt.hash('parola123', 10);
    await prisma.user.create({
      data: {
        email: 'test@jester.local',
        passwordHash: defaultPasswordHash,
        name: 'Utilizator Test',
        role: 'USER',
      },
    });
    await prisma.user.create({
      data: {
        email: 'courier@jester.local',
        passwordHash: defaultPasswordHash,
        name: 'Curier Test',
        role: 'COURIER',
      },
    });
    console.log('✅ Default users created (test@jester.local, courier@jester.local / parola123)');
  }

  // Create Categories
  const pizzaCategory = await prisma.category.create({
    data: {
      name: 'Pizza',
      slug: 'pizza',
      image: 'https://i.imgur.com/W5X0s4C.jpeg',
    },
  });

  const grillCategory = await prisma.category.create({
    data: {
      name: 'Grill',
      slug: 'grill',
      image: 'https://i.imgur.com/W5X0s4C.jpeg',
    },
  });

  const bakeCategory = await prisma.category.create({
    data: {
      name: 'Bake',
      slug: 'bake',
      image: 'https://i.imgur.com/W5X0s4C.jpeg',
    },
  });

  const supplyCategory = await prisma.category.create({
    data: {
      name: 'Supply',
      slug: 'supply',
      image: 'https://i.imgur.com/W5X0s4C.jpeg',
    },
  });

  const deliveryCategory = await prisma.category.create({
    data: {
      name: 'Jester Delivery',
      slug: 'delivery',
      image: 'https://i.imgur.com/W5X0s4C.jpeg',
    },
  });

  const antiqCategory = await prisma.category.create({
    data: {
      name: 'Antiq',
      slug: 'antiq',
      image: 'https://i.imgur.com/W5X0s4C.jpeg',
    },
  });

  const jester24Category = await prisma.category.create({
    data: {
      name: 'Jester 24/24',
      slug: 'jester-24-24',
      image: 'https://i.imgur.com/W5X0s4C.jpeg',
    },
  });

  console.log('✅ Categories created');

  // Create Restaurants
  const pizzaRestaurant = await prisma.restaurant.create({
    data: {
      name: 'Jester Pizza',
      description: 'Cea mai bună pizza din oraș',
      address: 'Strada Principală 123, București',
      phone: '+40 123 456 789',
      image: 'https://i.imgur.com/W5X0s4C.jpeg',
    },
  });

  const grillRestaurant = await prisma.restaurant.create({
    data: {
      name: 'Jester Grill',
      description: 'Grill autentic și delicios',
      address: 'Bulevardul Unirii 45, București',
      phone: '+40 123 456 790',
      image: 'https://i.imgur.com/W5X0s4C.jpeg',
    },
  });

  const generalRestaurant = await prisma.restaurant.create({
    data: {
      name: 'Jester General',
      description: 'Supply, Antiq, Jester 24/24',
      address: 'Sulina',
      phone: '+40 123 456 791',
      image: 'https://i.imgur.com/W5X0s4C.jpeg',
    },
  });

  console.log('✅ Restaurants created');

  const IMG = 'https://i.imgur.com/W5X0s4C.jpeg';

  // Pizza (6)
  const pizzaProducts = [
    { name: 'Pizza Margherita', description: 'Sos de roșii, mozzarella, busuioc proaspăt', price: 39.99, image: IMG, categoryId: pizzaCategory.id, restaurantId: pizzaRestaurant.id, available: true, isActive: true },
    { name: 'Pizza Pepperoni', description: 'Sos de roșii, mozzarella, pepperoni', price: 44.99, image: IMG, categoryId: pizzaCategory.id, restaurantId: pizzaRestaurant.id, available: true, isActive: true },
    { name: 'Pizza Quattro Stagioni', description: 'Sos de roșii, mozzarella, ciuperci, șuncă, măsline', price: 49.99, image: IMG, categoryId: pizzaCategory.id, restaurantId: pizzaRestaurant.id, available: true, isActive: true },
    { name: 'Pizza Capricciosa', description: 'Sos de roșii, mozzarella, ciuperci, șuncă, măsline, anghinare', price: 52.99, image: IMG, categoryId: pizzaCategory.id, restaurantId: pizzaRestaurant.id, available: true, isActive: true },
    { name: 'Pizza Diavola', description: 'Sos de roșii, mozzarella, salam picant', price: 46.99, image: IMG, categoryId: pizzaCategory.id, restaurantId: pizzaRestaurant.id, available: true, isActive: true },
    { name: 'Pizza Quattro Formaggi', description: 'Sos de roșii, mozzarella, gorgonzola, parmezan, cașcaval', price: 54.99, image: IMG, categoryId: pizzaCategory.id, restaurantId: pizzaRestaurant.id, available: true, isActive: true },
  ];

  // Grill (6)
  const grillProducts = [
    { name: 'Burger Jester', description: 'Chifla proaspătă, carne de vită, ceapă, roșii, salată, sos special', price: 42.99, image: IMG, categoryId: grillCategory.id, restaurantId: grillRestaurant.id, available: true, isActive: true },
    { name: 'Burger Clasic', description: 'Chifla, carne de vită, ceapă, roșii, salată, sos', price: 38.99, image: IMG, categoryId: grillCategory.id, restaurantId: grillRestaurant.id, available: true, isActive: true },
    { name: 'Șnițel de pui', description: 'Șnițel de pui pane, cartofi prăjiți, salată', price: 35.99, image: IMG, categoryId: grillCategory.id, restaurantId: grillRestaurant.id, available: true, isActive: true },
    { name: 'Cordon Bleu', description: 'Șnițel de pui cu șuncă și cașcaval, cartofi prăjiți', price: 45.99, image: IMG, categoryId: grillCategory.id, restaurantId: grillRestaurant.id, available: true, isActive: true },
    { name: 'Cotlet de porc', description: 'Cotlet grătar, cartofi, salată', price: 41.99, image: IMG, categoryId: grillCategory.id, restaurantId: grillRestaurant.id, available: true, isActive: true },
    { name: 'Aripioare picante', description: 'Aripioare de pui marinade, sos picant', price: 36.99, image: IMG, categoryId: grillCategory.id, restaurantId: grillRestaurant.id, available: true, isActive: true },
  ];

  // Bake (6)
  const bakeProducts = [
    { name: 'Croissant cu ciocolată', description: 'Croissant proaspăt cu ciocolată belgiană', price: 12.99, image: IMG, categoryId: bakeCategory.id, restaurantId: pizzaRestaurant.id, available: true, isActive: true },
    { name: 'Muffin cu afine', description: 'Muffin proaspăt cu afine', price: 15.99, image: IMG, categoryId: bakeCategory.id, restaurantId: pizzaRestaurant.id, available: true, isActive: true },
    { name: 'Tort Jester', description: 'Tort cu ciocolată și fructe', price: 89.99, image: IMG, categoryId: bakeCategory.id, restaurantId: pizzaRestaurant.id, available: true, isActive: true },
    { name: 'Chec cu vanilie', description: 'Chec clasic cu vanilie', price: 18.99, image: IMG, categoryId: bakeCategory.id, restaurantId: pizzaRestaurant.id, available: true, isActive: true },
    { name: 'Plăcintă cu mere', description: 'Plăcintă cu mere și scorțișoară', price: 14.99, image: IMG, categoryId: bakeCategory.id, restaurantId: pizzaRestaurant.id, available: true, isActive: true },
    { name: 'Brownie', description: 'Brownie cu ciocolată', price: 16.99, image: IMG, categoryId: bakeCategory.id, restaurantId: pizzaRestaurant.id, available: true, isActive: true },
  ];

  // Supply (6) – supe & ciorbe
  const supplyProducts = [
    { name: 'Ciorbă de burtă', description: 'Ciorbă de burtă tradițională', price: 24.99, image: IMG, categoryId: supplyCategory.id, restaurantId: generalRestaurant.id, available: true, isActive: true },
    { name: 'Ciorbă de legume', description: 'Ciorbă de legume proaspete', price: 18.99, image: IMG, categoryId: supplyCategory.id, restaurantId: generalRestaurant.id, available: true, isActive: true },
    { name: 'Supă cremă de ciuperci', description: 'Supă cremă de ciuperci', price: 19.99, image: IMG, categoryId: supplyCategory.id, restaurantId: generalRestaurant.id, available: true, isActive: true },
    { name: 'Ciorbă rădăuțeană', description: 'Ciorbă rădăuțeană cu smântână', price: 22.99, image: IMG, categoryId: supplyCategory.id, restaurantId: generalRestaurant.id, available: true, isActive: true },
    { name: 'Supă de pui', description: 'Supă de pui cu tăiței', price: 17.99, image: IMG, categoryId: supplyCategory.id, restaurantId: generalRestaurant.id, available: true, isActive: true },
    { name: 'Ciorbă de fasole', description: 'Ciorbă de fasole cu afumătură', price: 20.99, image: IMG, categoryId: supplyCategory.id, restaurantId: generalRestaurant.id, available: true, isActive: true },
  ];

  // Antiq (6) – suveniruri
  const antiqProducts = [
    { name: 'Magnet Sulina', description: 'Magnet suvenir Sulina', price: 12, image: IMG, categoryId: antiqCategory.id, restaurantId: generalRestaurant.id, available: true, isActive: true },
    { name: 'Căniță Delta Dunării', description: 'Căniță cu print Delta Dunării', price: 25, image: IMG, categoryId: antiqCategory.id, restaurantId: generalRestaurant.id, available: true, isActive: true },
    { name: 'Tricou Jester', description: 'Tricou cu logo Jester', price: 45, image: IMG, categoryId: antiqCategory.id, restaurantId: generalRestaurant.id, available: true, isActive: true },
    { name: 'Carte poștală Sulina', description: 'Carte poștală vintage Sulina', price: 5, image: IMG, categoryId: antiqCategory.id, restaurantId: generalRestaurant.id, available: true, isActive: true },
    { name: 'Breloc far', description: 'Breloc mini far Sulina', price: 15, image: IMG, categoryId: antiqCategory.id, restaurantId: generalRestaurant.id, available: true, isActive: true },
    { name: 'Set 3 magneturi', description: 'Set 3 magneturi Delta', price: 28, image: IMG, categoryId: antiqCategory.id, restaurantId: generalRestaurant.id, available: true, isActive: true },
  ];

  // Jester 24/24 – toate produsele din catalogul static (jester24-products.ts) pentru checkout valid
  const jester24Products = [
    // Snacks
    { name: 'Peperoni', description: 'Snacks', price: 12, image: IMG, categoryId: jester24Category.id, restaurantId: generalRestaurant.id, available: true, isActive: true },
    { name: 'Carpathian Jerky', description: 'Jerky', price: 18, image: IMG, categoryId: jester24Category.id, restaurantId: generalRestaurant.id, available: true, isActive: true },
    { name: 'Chio Chips', description: 'Chips', price: 8, image: IMG, categoryId: jester24Category.id, restaurantId: generalRestaurant.id, available: true, isActive: true },
    { name: 'Toblerone', description: 'Ciocolată', price: 15, image: IMG, categoryId: jester24Category.id, restaurantId: generalRestaurant.id, available: true, isActive: true },
    { name: 'Semințe', description: 'Semințe', price: 5, image: IMG, categoryId: jester24Category.id, restaurantId: generalRestaurant.id, available: true, isActive: true },
    { name: 'Twix', description: 'Twix', price: 7, image: IMG, categoryId: jester24Category.id, restaurantId: generalRestaurant.id, available: true, isActive: true },
    { name: 'Mars', description: 'Mars', price: 7, image: IMG, categoryId: jester24Category.id, restaurantId: generalRestaurant.id, available: true, isActive: true },
    { name: 'Skittles', description: 'Skittles', price: 9, image: IMG, categoryId: jester24Category.id, restaurantId: generalRestaurant.id, available: true, isActive: true },
    { name: 'Pringles', description: 'Pringles', price: 14, image: IMG, categoryId: jester24Category.id, restaurantId: generalRestaurant.id, available: true, isActive: true },
    { name: 'Kinder Bueno', description: 'Kinder Bueno', price: 11, image: IMG, categoryId: jester24Category.id, restaurantId: generalRestaurant.id, available: true, isActive: true },
    // Băuturi
    { name: 'Pepsi', description: 'Pepsi 330ml', price: 6, image: IMG, categoryId: jester24Category.id, restaurantId: generalRestaurant.id, available: true, isActive: true },
    { name: 'Fanta', description: 'Fanta 330ml', price: 6, image: IMG, categoryId: jester24Category.id, restaurantId: generalRestaurant.id, available: true, isActive: true },
    { name: 'Sprite', description: 'Sprite 330ml', price: 6, image: IMG, categoryId: jester24Category.id, restaurantId: generalRestaurant.id, available: true, isActive: true },
    { name: 'Apă plată', description: 'Apă plată 500ml', price: 4, image: IMG, categoryId: jester24Category.id, restaurantId: generalRestaurant.id, available: true, isActive: true },
    { name: 'Apă carbogazoasă', description: 'Apă carbogazoasă', price: 4, image: IMG, categoryId: jester24Category.id, restaurantId: generalRestaurant.id, available: true, isActive: true },
    { name: 'Heineken', description: 'Bere', price: 10, image: IMG, categoryId: jester24Category.id, restaurantId: generalRestaurant.id, available: true, isActive: true },
    { name: 'Timișoreana', description: 'Bere', price: 8, image: IMG, categoryId: jester24Category.id, restaurantId: generalRestaurant.id, available: true, isActive: true },
    { name: 'Fetească regală sec', description: 'Vin', price: 45, image: IMG, categoryId: jester24Category.id, restaurantId: generalRestaurant.id, available: true, isActive: true },
    { name: 'Vodka Absolut', description: 'Vodka', price: 85, image: IMG, categoryId: jester24Category.id, restaurantId: generalRestaurant.id, available: true, isActive: true },
    { name: 'Whiskey Jameson', description: 'Whiskey', price: 120, image: IMG, categoryId: jester24Category.id, restaurantId: generalRestaurant.id, available: true, isActive: true },
    // Țigări și Accesorii
    { name: 'Kent Classic', description: 'Țigări', price: 28, image: IMG, categoryId: jester24Category.id, restaurantId: generalRestaurant.id, available: true, isActive: true },
    { name: 'Dunhill', description: 'Țigări', price: 35, image: IMG, categoryId: jester24Category.id, restaurantId: generalRestaurant.id, available: true, isActive: true },
    { name: 'Pall Mall', description: 'Țigări', price: 26, image: IMG, categoryId: jester24Category.id, restaurantId: generalRestaurant.id, available: true, isActive: true },
    { name: 'OCB', description: 'Accesorii', price: 12, image: IMG, categoryId: jester24Category.id, restaurantId: generalRestaurant.id, available: true, isActive: true },
    { name: 'Filtre', description: 'Filtre', price: 8, image: IMG, categoryId: jester24Category.id, restaurantId: generalRestaurant.id, available: true, isActive: true },
  ];

  const allProducts = [
    ...pizzaProducts,
    ...grillProducts,
    ...bakeProducts,
    ...supplyProducts,
    ...antiqProducts,
    ...jester24Products,
  ];

  for (const product of allProducts) {
    await prisma.product.create({ data: product });
  }

  console.log('✅ Products created');
  console.log(`✅ Seeded ${allProducts.length} products (pizza: 6, grill: 6, bake: 6, supply: 6, antiq: 6, jester-24-24: ${jester24Products.length})`);

  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

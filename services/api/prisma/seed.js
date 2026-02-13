const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
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
  await prisma.user.deleteMany();

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

  console.log('✅ Restaurants created');

  // Create Products
  const products = [
    // Pizza products
    {
      name: 'Pizza Margherita',
      description: 'Sos de roșii, mozzarella, busuioc proaspăt',
      price: 39.99,
      image: 'https://i.imgur.com/W5X0s4C.jpeg',
      categoryId: pizzaCategory.id,
      restaurantId: pizzaRestaurant.id,
      available: true,
    },
    {
      name: 'Pizza Pepperoni',
      description: 'Sos de roșii, mozzarella, pepperoni',
      price: 44.99,
      image: 'https://i.imgur.com/W5X0s4C.jpeg',
      categoryId: pizzaCategory.id,
      restaurantId: pizzaRestaurant.id,
      available: true,
    },
    {
      name: 'Pizza Quattro Stagioni',
      description: 'Sos de roșii, mozzarella, ciuperci, șuncă, măsline',
      price: 49.99,
      image: 'https://i.imgur.com/W5X0s4C.jpeg',
      categoryId: pizzaCategory.id,
      restaurantId: pizzaRestaurant.id,
      available: true,
    },
    {
      name: 'Pizza Capricciosa',
      description: 'Sos de roșii, mozzarella, ciuperci, șuncă, măsline, anghinare',
      price: 52.99,
      image: 'https://i.imgur.com/W5X0s4C.jpeg',
      categoryId: pizzaCategory.id,
      restaurantId: pizzaRestaurant.id,
      available: true,
    },
    // Grill products
    {
      name: 'Burger Jester',
      description: 'Chifla proaspătă, carne de vită, ceapă, roșii, salată, sos special',
      price: 42.99,
      image: 'https://i.imgur.com/W5X0s4C.jpeg',
      categoryId: grillCategory.id,
      restaurantId: grillRestaurant.id,
      available: true,
    },
    {
      name: 'Burger Clasic',
      description: 'Chifla, carne de vită, ceapă, roșii, salată, sos',
      price: 38.99,
      image: 'https://i.imgur.com/W5X0s4C.jpeg',
      categoryId: grillCategory.id,
      restaurantId: grillRestaurant.id,
      available: true,
    },
    {
      name: 'Șnițel de pui',
      description: 'Șnițel de pui pane, cartofi prăjiți, salată',
      price: 35.99,
      image: 'https://i.imgur.com/W5X0s4C.jpeg',
      categoryId: grillCategory.id,
      restaurantId: grillRestaurant.id,
      available: true,
    },
    {
      name: 'Cordon Bleu',
      description: 'Șnițel de pui cu șuncă și cașcaval, cartofi prăjiți',
      price: 45.99,
      image: 'https://i.imgur.com/W5X0s4C.jpeg',
      categoryId: grillCategory.id,
      restaurantId: grillRestaurant.id,
      available: true,
    },
    // Bake products
    {
      name: 'Croissant cu ciocolată',
      description: 'Croissant proaspăt cu ciocolată belgiană',
      price: 12.99,
      image: 'https://i.imgur.com/W5X0s4C.jpeg',
      categoryId: bakeCategory.id,
      restaurantId: pizzaRestaurant.id,
      available: true,
    },
    {
      name: 'Muffin cu afine',
      description: 'Muffin proaspăt cu afine',
      price: 15.99,
      image: 'https://i.imgur.com/W5X0s4C.jpeg',
      categoryId: bakeCategory.id,
      restaurantId: pizzaRestaurant.id,
      available: true,
    },
    {
      name: 'Tort Jester',
      description: 'Tort cu ciocolată și fructe',
      price: 89.99,
      image: 'https://i.imgur.com/W5X0s4C.jpeg',
      categoryId: bakeCategory.id,
      restaurantId: pizzaRestaurant.id,
      available: true,
    },
  ];

  for (const product of products) {
    await prisma.product.create({ data: product });
  }

  console.log('✅ Products created');
  console.log(`✅ Seeded ${products.length} products`);

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

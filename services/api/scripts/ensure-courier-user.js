/**
 * Creează utilizatorul curier dacă nu există.
 * Email: courier@jester.local
 * Parolă: parola123
 * Rulează: node scripts/ensure-courier-user.js (din services/api)
 */
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL lipsește din .env');
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const COURIER_EMAIL = 'courier@jester.local';
const COURIER_PASSWORD = 'parola123';

async function main() {
  const existing = await prisma.user.findUnique({
    where: { email: COURIER_EMAIL },
    select: { id: true },
  });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { role: 'COURIER' },
    });
    console.log('✅ Cont curier există deja:', COURIER_EMAIL, '- rol setat COURIER');
    return;
  }

  const passwordHash = await bcrypt.hash(COURIER_PASSWORD, 10);
  await prisma.user.create({
    data: {
      email: COURIER_EMAIL,
      passwordHash,
      name: 'Curier Test',
      role: 'COURIER',
    },
  });
  console.log('✅ Cont curier creat.');
  console.log('   Email:', COURIER_EMAIL);
  console.log('   Parolă:', COURIER_PASSWORD);
}

main()
  .catch((e) => {
    console.error('Eroare:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

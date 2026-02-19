/**
 * Rulează seed doar dacă nu există niciun user (cold start / DB goală).
 * Apelat din stack.sh după prisma db push.
 */
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  process.exit(0);
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const count = await prisma.user.count();
  if (count === 0) {
    const { execSync } = require('child_process');
    const path = require('path');
    execSync('node prisma/seed.js', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(() => prisma.$disconnect());

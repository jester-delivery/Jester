-- DropIndex (IF EXISTS: safe dacă indexul lipsește pe unele DB-uri)
DROP INDEX IF EXISTS "cart_orders_user_id_idx";

-- AlterTable (IF NOT EXISTS: safe dacă coloanele există deja)
ALTER TABLE "cart_orders" ADD COLUMN IF NOT EXISTS "estimated_delivery_minutes" INTEGER;
ALTER TABLE "cart_orders" ADD COLUMN IF NOT EXISTS "internal_notes" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "addresses" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "number" TEXT,
    "details" TEXT,
    "city" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey (doar dacă nu există)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'addresses_user_id_fkey') THEN
    ALTER TABLE "addresses" ADD CONSTRAINT "addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

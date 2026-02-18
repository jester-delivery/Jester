-- AlterTable: isActive (ON/OFF), sortOrder, stock pentru cockpit Admin
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "sort_order" INTEGER;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "stock" INTEGER;

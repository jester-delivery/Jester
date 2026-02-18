-- AlterTable: soft delete pentru comenzi (doar PENDING poate fi șters)
ALTER TABLE "cart_orders" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);

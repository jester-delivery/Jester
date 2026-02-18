-- Asigură toate coloanele cart_orders din schema Prisma (idempotency_key, order_type etc.)
-- Idempotent: ADD COLUMN IF NOT EXISTS / CREATE UNIQUE INDEX IF NOT EXISTS

ALTER TABLE "cart_orders" ADD COLUMN IF NOT EXISTS "idempotency_key" TEXT;
ALTER TABLE "cart_orders" ADD COLUMN IF NOT EXISTS "order_type" TEXT NOT NULL DEFAULT 'product_order';

CREATE UNIQUE INDEX IF NOT EXISTS "cart_orders_user_id_idempotency_key_key"
  ON "cart_orders"("user_id", "idempotency_key");

-- Courier accept flow: ACCEPTED status, assigned_courier_id, courier_accepted_at, courier_rejections, users.role
-- Toate cu IF NOT EXISTS / ADD VALUE IF NOT EXISTS unde e posibil ca migrarea să fie idempotentă.

-- 1. OrderStatus: adaugă ACCEPTED (necesar pentru accept curier)
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'ACCEPTED';

-- 2. cart_orders: coloane pentru curier
ALTER TABLE "cart_orders" ADD COLUMN IF NOT EXISTS "assigned_courier_id" TEXT;
ALTER TABLE "cart_orders" ADD COLUMN IF NOT EXISTS "courier_accepted_at" TIMESTAMP(3);

-- 3. users.role: enum UserRole + coloană role (pentru requireCourier)
DO $$
BEGIN
  CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'COURIER');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role" "UserRole" NOT NULL DEFAULT 'USER';

-- 4. Tabel courier_rejections (refuzuri curier)
CREATE TABLE IF NOT EXISTS "courier_rejections" (
  "id" TEXT NOT NULL,
  "order_id" TEXT NOT NULL,
  "courier_id" TEXT NOT NULL,
  "rejected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reason" TEXT,
  CONSTRAINT "courier_rejections_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'courier_rejections_order_id_fkey'
  ) THEN
    ALTER TABLE "courier_rejections" ADD CONSTRAINT "courier_rejections_order_id_fkey"
      FOREIGN KEY ("order_id") REFERENCES "cart_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS "courier_rejections_order_id_courier_id_key"
  ON "courier_rejections"("order_id", "courier_id");

-- 5. order_status_logs (folosit la accept/status change)
CREATE TABLE IF NOT EXISTS "order_status_logs" (
  "id" TEXT NOT NULL,
  "order_id" TEXT NOT NULL,
  "previous_status" TEXT NOT NULL,
  "new_status" TEXT NOT NULL,
  "changed_by_user_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "order_status_logs_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'order_status_logs_order_id_fkey'
  ) THEN
    ALTER TABLE "order_status_logs" ADD CONSTRAINT "order_status_logs_order_id_fkey"
      FOREIGN KEY ("order_id") REFERENCES "cart_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

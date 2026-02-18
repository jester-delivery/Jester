-- Asigură coloana deleted_at pe cart_orders (unele instanțe DB o pot lipsi)
ALTER TABLE "cart_orders" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);

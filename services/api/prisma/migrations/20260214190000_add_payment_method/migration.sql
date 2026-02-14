-- AlterTable
ALTER TABLE "cart_orders" ADD COLUMN "payment_method" TEXT NOT NULL DEFAULT 'CASH_ON_DELIVERY';

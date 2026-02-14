-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'ON_THE_WAY';

-- DropIndex
DROP INDEX "cart_orders_user_id_idx";

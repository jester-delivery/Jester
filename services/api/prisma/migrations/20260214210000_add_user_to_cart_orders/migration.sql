-- AlterTable
ALTER TABLE "cart_orders" ADD COLUMN "user_id" TEXT;

-- CreateIndex
CREATE INDEX "cart_orders_user_id_idx" ON "cart_orders"("user_id");

-- AddForeignKey
ALTER TABLE "cart_orders" ADD CONSTRAINT "cart_orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

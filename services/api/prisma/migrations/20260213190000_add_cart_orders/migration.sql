-- CreateTable
CREATE TABLE "cart_orders" (
    "id" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "total" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cart_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_order_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "cart_order_items_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "cart_order_items" ADD CONSTRAINT "cart_order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "cart_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

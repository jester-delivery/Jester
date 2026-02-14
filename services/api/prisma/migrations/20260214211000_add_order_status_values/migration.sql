-- Add new enum values to OrderStatus (Glovo-style)
ALTER TYPE "OrderStatus" ADD VALUE 'OUT_FOR_DELIVERY';
ALTER TYPE "OrderStatus" ADD VALUE 'CANCELED';

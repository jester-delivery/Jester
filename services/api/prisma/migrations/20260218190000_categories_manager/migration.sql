-- Categories Manager: isActive, sortOrder, description (icon = image existent)
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "sort_order" INTEGER;

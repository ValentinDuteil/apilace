-- AlterTable
ALTER TABLE "ProductSection" ADD COLUMN     "specs" JSONB;

-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "email" TEXT,
ADD COLUMN     "phone" TEXT;

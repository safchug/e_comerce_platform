-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "status" "OrderStatus" NOT NULL DEFAULT 'PENDING';

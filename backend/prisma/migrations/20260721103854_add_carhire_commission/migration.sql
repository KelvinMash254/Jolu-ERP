-- AlterTable
ALTER TABLE "CarHireBooking" ADD COLUMN     "actualBalance" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "commission" DECIMAL(15,2) NOT NULL DEFAULT 0;

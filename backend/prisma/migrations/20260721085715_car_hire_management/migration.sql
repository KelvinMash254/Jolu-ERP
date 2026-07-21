/*
  Warnings:

  - You are about to drop the column `driverAssigned` on the `CarHireBooking` table. All the data in the column will be lost.
  - You are about to drop the column `vehicleStatus` on the `CarHireBooking` table. All the data in the column will be lost.
  - You are about to drop the column `purchasePrice` on the `Vehicle` table. All the data in the column will be lost.
  - You are about to drop the column `sellingPrice` on the `Vehicle` table. All the data in the column will be lost.
  - You are about to drop the column `soldAt` on the `Vehicle` table. All the data in the column will be lost.
  - You are about to drop the column `stockStatus` on the `Vehicle` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CarHireBooking" DROP COLUMN "driverAssigned",
DROP COLUMN "vehicleStatus",
ADD COLUMN     "driverId" TEXT,
ADD COLUMN     "dropoffBranch" TEXT NOT NULL DEFAULT 'Head Office',
ADD COLUMN     "optionalExtras" JSONB,
ADD COLUMN     "pickupBranch" TEXT NOT NULL DEFAULT 'Head Office',
ADD COLUMN     "pickupTime" TEXT NOT NULL DEFAULT '09:00',
ADD COLUMN     "pricingDetails" JSONB,
ADD COLUMN     "rentalDuration" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "rentalType" TEXT NOT NULL DEFAULT 'SelfDrive',
ADD COLUMN     "returnTime" TEXT NOT NULL DEFAULT '17:00',
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'Pending';

-- AlterTable
ALTER TABLE "Vehicle" DROP COLUMN "purchasePrice",
DROP COLUMN "sellingPrice",
DROP COLUMN "soldAt",
DROP COLUMN "stockStatus",
ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'Sedan',
ADD COLUMN     "color" TEXT NOT NULL DEFAULT 'White',
ADD COLUMN     "currentBranch" TEXT NOT NULL DEFAULT 'Head Office',
ADD COLUMN     "currentDriverId" TEXT,
ADD COLUMN     "dailyRate" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "depositRequired" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "documents" TEXT,
ADD COLUMN     "fuelType" TEXT NOT NULL DEFAULT 'Petrol',
ADD COLUMN     "gpsTrackingId" TEXT,
ADD COLUMN     "hourlyRate" DECIMAL(15,2),
ADD COLUMN     "images" TEXT,
ADD COLUMN     "inspectionExpiry" TIMESTAMP(3),
ADD COLUMN     "insuranceExpiry" TIMESTAMP(3),
ADD COLUMN     "monthlyRate" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "roadLicenseExpiry" TIMESTAMP(3),
ADD COLUMN     "seatingCapacity" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "serviceDueDate" TIMESTAMP(3),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'Available',
ADD COLUMN     "transmission" TEXT NOT NULL DEFAULT 'Automatic',
ADD COLUMN     "weeklyRate" DECIMAL(15,2) NOT NULL DEFAULT 0;

-- DropEnum
DROP TYPE "VehicleStatus";

-- CreateTable
CREATE TABLE "Driver" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "licenseClass" TEXT NOT NULL,
    "licenseExpiry" TIMESTAMP(3) NOT NULL,
    "medicalExpiry" TIMESTAMP(3),
    "phone" TEXT NOT NULL,
    "salary" DECIMAL(15,2),
    "emergencyContact" TEXT,
    "photoUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Available',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Driver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleInspection" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "fuelLevel" TEXT NOT NULL,
    "mileageOut" INTEGER NOT NULL,
    "bodyCondition" TEXT NOT NULL,
    "tyreCondition" TEXT NOT NULL,
    "accessories" TEXT,
    "photos" TEXT,
    "driverSignature" TEXT,
    "customerSignature" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehicleInspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReturnInspection" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "fuelReturned" TEXT NOT NULL,
    "mileageIn" INTEGER NOT NULL,
    "bodyCondition" TEXT NOT NULL,
    "tyreCondition" TEXT NOT NULL,
    "additionalCharges" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "lateFees" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "cleaningCharges" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "depositRefundStatus" TEXT NOT NULL DEFAULT 'Pending',
    "photos" TEXT,
    "signature" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReturnInspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleMaintenance" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "cost" DECIMAL(15,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "mileageAtService" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Completed',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehicleMaintenance_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_currentDriverId_fkey" FOREIGN KEY ("currentDriverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarHireBooking" ADD CONSTRAINT "CarHireBooking_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleInspection" ADD CONSTRAINT "VehicleInspection_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "CarHireBooking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnInspection" ADD CONSTRAINT "ReturnInspection_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "CarHireBooking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleMaintenance" ADD CONSTRAINT "VehicleMaintenance_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

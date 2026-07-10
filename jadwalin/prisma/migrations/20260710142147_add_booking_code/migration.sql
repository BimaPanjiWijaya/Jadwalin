/*
  Warnings:

  - A unique constraint covering the columns `[booking_code]` on the table `bookings` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `booking_code` to the `bookings` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "booking_code" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "bookings_booking_code_key" ON "bookings"("booking_code");

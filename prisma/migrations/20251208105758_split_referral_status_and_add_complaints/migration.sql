/*
  Warnings:

  - You are about to drop the column `referralStatus` on the `PatientRegistration` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PatientRegistration" ADD COLUMN     "complaints" TEXT[],
ADD COLUMN     "otherComplaint" TEXT,
ADD COLUMN     "referredFrom" TEXT,
ADD COLUMN     "referredTo" TEXT;

-- Migrate existing referralStatus data to referredTo
UPDATE "PatientRegistration" SET "referredTo" = "referralStatus";

-- Drop the old column
ALTER TABLE "PatientRegistration" DROP COLUMN "referralStatus";

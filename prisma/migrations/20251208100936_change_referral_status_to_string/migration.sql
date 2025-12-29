/*
  Warnings:

  - Changed the type of `referralStatus` on the `PatientRegistration` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "PatientRegistration" ALTER COLUMN "referralStatus" TYPE TEXT USING "referralStatus"::text;

-- DropEnum
DROP TYPE "ReferralStatus";

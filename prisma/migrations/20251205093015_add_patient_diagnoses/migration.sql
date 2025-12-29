/*
  Warnings:

  - You are about to drop the column `diagnosisPerUD` on the `PatientRegistration` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PatientRegistration" DROP COLUMN "diagnosisPerUD";

-- CreateTable
CREATE TABLE "_ICD10ConditionToPatientRegistration" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ICD10ConditionToPatientRegistration_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ICD10ConditionToPatientRegistration_B_index" ON "_ICD10ConditionToPatientRegistration"("B");

-- AddForeignKey
ALTER TABLE "_ICD10ConditionToPatientRegistration" ADD CONSTRAINT "_ICD10ConditionToPatientRegistration_A_fkey" FOREIGN KEY ("A") REFERENCES "ICD10Condition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ICD10ConditionToPatientRegistration" ADD CONSTRAINT "_ICD10ConditionToPatientRegistration_B_fkey" FOREIGN KEY ("B") REFERENCES "PatientRegistration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

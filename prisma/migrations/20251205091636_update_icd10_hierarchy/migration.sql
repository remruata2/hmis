-- AlterTable
ALTER TABLE "ICD10Condition" ADD COLUMN     "parentId" TEXT;

-- CreateIndex
CREATE INDEX "ICD10Condition_parentId_idx" ON "ICD10Condition"("parentId");

-- AddForeignKey
ALTER TABLE "ICD10Condition" ADD CONSTRAINT "ICD10Condition_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ICD10Condition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

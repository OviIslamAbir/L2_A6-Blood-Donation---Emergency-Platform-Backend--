-- CreateEnum
CREATE TYPE "RequesterType" AS ENUM ('PATIENT', 'HOSPITAL');

-- AlterTable
ALTER TABLE "BloodRequest" ALTER COLUMN "urgency" SET DEFAULT 'NORMAL';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "requesterType" "RequesterType",
ALTER COLUMN "role" SET DEFAULT 'REQUESTER';

-- CreateIndex
CREATE INDEX "User_requesterType_idx" ON "User"("requesterType");

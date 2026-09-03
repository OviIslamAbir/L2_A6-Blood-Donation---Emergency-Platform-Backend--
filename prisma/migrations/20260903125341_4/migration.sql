/*
  Warnings:

  - Added the required column `requesterType` to the `BloodRequest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BloodRequest" ADD COLUMN     "requesterType" "RequesterType" NOT NULL;

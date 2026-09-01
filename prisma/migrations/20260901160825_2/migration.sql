-- CreateEnum
CREATE TYPE "DonorApplicationStatus" AS ENUM ('NONE', 'PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "DonorProfile" ADD COLUMN     "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "rejectReason" TEXT,
ADD COLUMN     "rejectedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "donorApplicationStatus" "DonorApplicationStatus" NOT NULL DEFAULT 'NONE';

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'BLOCKED', 'SUSPENDED');

-- AlterTable
ALTER TABLE "UserAccount" ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE';

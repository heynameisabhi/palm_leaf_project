/*
  Warnings:

  - Made the column `password` on table `UserAccount` required. This step will fail if there are existing NULL values in that column.
  - Made the column `role` on table `UserAccount` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "UserAccount" ALTER COLUMN "password" SET NOT NULL,
ALTER COLUMN "role" SET NOT NULL;

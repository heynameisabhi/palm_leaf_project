/*
  Warnings:

  - A unique constraint covering the columns `[user_name]` on the table `UserAccount` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `UserAccount` will be added. If there are existing duplicate values, this will fail.
  - Made the column `user_name` on table `UserAccount` required. This step will fail if there are existing NULL values in that column.
  - Made the column `email` on table `UserAccount` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "UserAccount" ALTER COLUMN "user_name" SET NOT NULL,
ALTER COLUMN "email" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "UserAccount_user_name_key" ON "UserAccount"("user_name");

-- CreateIndex
CREATE UNIQUE INDEX "UserAccount_email_key" ON "UserAccount"("email");

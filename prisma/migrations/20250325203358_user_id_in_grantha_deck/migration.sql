/*
  Warnings:

  - The primary key for the `GranthaDeck` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[grantha_deck_id]` on the table `GranthaDeck` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `user_id` to the `GranthaDeck` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "GranthaDeck" DROP CONSTRAINT "GranthaDeck_pkey",
ADD COLUMN     "user_id" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "GranthaDeck_grantha_deck_id_key" ON "GranthaDeck"("grantha_deck_id");

-- AddForeignKey
ALTER TABLE "GranthaDeck" ADD CONSTRAINT "GranthaDeck_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "UserAccount"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

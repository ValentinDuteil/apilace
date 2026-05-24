/*
  Warnings:

  - A unique constraint covering the columns `[unsubscribeToken]` on the table `Newsletter` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `unsubscribeToken` to the `Newsletter` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Newsletter" ADD COLUMN     "unsubscribeToken" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Newsletter_unsubscribeToken_key" ON "Newsletter"("unsubscribeToken");

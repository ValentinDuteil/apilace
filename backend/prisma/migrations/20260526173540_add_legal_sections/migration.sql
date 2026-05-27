/*
  Warnings:

  - You are about to drop the column `content` on the `LegalPage` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "LegalPage" DROP COLUMN "content";

-- CreateTable
CREATE TABLE "LegalSection" (
    "id" SERIAL NOT NULL,
    "legalPageId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "LegalSection_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "LegalSection" ADD CONSTRAINT "LegalSection_legalPageId_fkey" FOREIGN KEY ("legalPageId") REFERENCES "LegalPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

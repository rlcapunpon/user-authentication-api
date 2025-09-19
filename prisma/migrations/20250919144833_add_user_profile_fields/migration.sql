/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `full_name` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "avatar_url" TEXT,
ADD COLUMN     "full_name" TEXT NOT NULL DEFAULT 'Unknown User',
ADD COLUMN     "last_login" TIMESTAMP(3),
ADD COLUMN     "username" TEXT NOT NULL DEFAULT 'temp_user';

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "public"."User"("username");

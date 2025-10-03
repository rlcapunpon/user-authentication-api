-- CreateEnum
CREATE TYPE "public"."ResourceStatusEnum" AS ENUM ('ACTIVE', 'INACTIVE', 'DELETED');

-- CreateTable
CREATE TABLE "public"."ResourceStatus" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "status" "public"."ResourceStatusEnum" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResourceStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ResourceStatus_resourceId_key" ON "public"."ResourceStatus"("resourceId");

-- AddForeignKey
ALTER TABLE "public"."ResourceStatus" ADD CONSTRAINT "ResourceStatus_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "public"."Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "public"."UserPasswordUpdate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastUpdate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "UserPasswordUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserPasswordUpdate_userId_idx" ON "public"."UserPasswordUpdate"("userId");

-- AddForeignKey
ALTER TABLE "public"."UserPasswordUpdate" ADD CONSTRAINT "UserPasswordUpdate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

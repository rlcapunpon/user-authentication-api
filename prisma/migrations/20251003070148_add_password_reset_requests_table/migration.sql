-- CreateTable
CREATE TABLE "public"."PasswordResetRequests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "lastRequestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetRequests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PasswordResetRequests_userId_idx" ON "public"."PasswordResetRequests"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetRequests_userEmail_key" ON "public"."PasswordResetRequests"("userEmail");

-- AddForeignKey
ALTER TABLE "public"."PasswordResetRequests" ADD CONSTRAINT "PasswordResetRequests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

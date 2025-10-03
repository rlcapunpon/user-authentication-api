-- CreateTable
CREATE TABLE "public"."UserLoginHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastLogin" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "UserLoginHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserLoginHistory_userId_idx" ON "public"."UserLoginHistory"("userId");

-- AddForeignKey
ALTER TABLE "public"."UserLoginHistory" ADD CONSTRAINT "UserLoginHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

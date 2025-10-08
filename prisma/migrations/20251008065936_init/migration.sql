-- CreateEnum
CREATE TYPE "public"."ResourceStatusEnum" AS ENUM ('ACTIVE', 'INACTIVE', 'DELETED');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserDetails" (
    "id" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "nickName" TEXT,
    "contactNumber" TEXT,
    "reportToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Credential" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,

    CONSTRAINT "Credential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Resource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" TEXT[],

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserResourceRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resourceId" TEXT,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "UserResourceRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserVerification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerificationDate" TIMESTAMP(3),
    "isContactVerified" BOOLEAN NOT NULL DEFAULT false,
    "contactVerificationDate" TIMESTAMP(3),
    "isReporterAssigned" BOOLEAN NOT NULL DEFAULT false,
    "verificationStatus" TEXT NOT NULL DEFAULT 'unverified',
    "userStatus" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EmailVerificationCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "verificationCode" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailVerificationCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ResourceStatus" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "status" "public"."ResourceStatusEnum" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResourceStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserPasswordUpdate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastUpdate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "UserPasswordUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserLoginHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastLogin" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "UserLoginHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PasswordResetRequests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "lastRequestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetRequests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ApiKey" (
    "id" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserDetails_id_key" ON "public"."UserDetails"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Credential_userId_key" ON "public"."Credential"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Resource_name_key" ON "public"."Resource"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "public"."Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_unique" ON "public"."Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UserResourceRole_userId_roleId_resourceId_key" ON "public"."UserResourceRole"("userId", "roleId", "resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "UserVerification_userId_key" ON "public"."UserVerification"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailVerificationCode_verificationCode_key" ON "public"."EmailVerificationCode"("verificationCode");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceStatus_resourceId_key" ON "public"."ResourceStatus"("resourceId");

-- CreateIndex
CREATE INDEX "UserPasswordUpdate_userId_idx" ON "public"."UserPasswordUpdate"("userId");

-- CreateIndex
CREATE INDEX "UserLoginHistory_userId_idx" ON "public"."UserLoginHistory"("userId");

-- CreateIndex
CREATE INDEX "PasswordResetRequests_userId_idx" ON "public"."PasswordResetRequests"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetRequests_userEmail_key" ON "public"."PasswordResetRequests"("userEmail");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "public"."ApiKey"("keyHash");

-- AddForeignKey
ALTER TABLE "public"."UserDetails" ADD CONSTRAINT "UserDetails_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserDetails" ADD CONSTRAINT "UserDetails_reportToId_fkey" FOREIGN KEY ("reportToId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Credential" ADD CONSTRAINT "Credential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserResourceRole" ADD CONSTRAINT "UserResourceRole_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "public"."Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserResourceRole" ADD CONSTRAINT "UserResourceRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserResourceRole" ADD CONSTRAINT "UserResourceRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserVerification" ADD CONSTRAINT "UserVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EmailVerificationCode" ADD CONSTRAINT "EmailVerificationCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ResourceStatus" ADD CONSTRAINT "ResourceStatus_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "public"."Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserPasswordUpdate" ADD CONSTRAINT "UserPasswordUpdate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserLoginHistory" ADD CONSTRAINT "UserLoginHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PasswordResetRequests" ADD CONSTRAINT "PasswordResetRequests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

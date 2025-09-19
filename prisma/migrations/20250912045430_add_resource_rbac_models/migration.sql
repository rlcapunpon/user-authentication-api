-- CreateTable
CREATE TABLE "public"."ResourceRole" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResourceRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RolePermissionMap" (
    "resourceRoleId" TEXT NOT NULL,
    "permissionVerb" TEXT NOT NULL,

    CONSTRAINT "RolePermissionMap_pkey" PRIMARY KEY ("resourceRoleId","permissionVerb")
);

-- CreateTable
CREATE TABLE "public"."UserResourceRole" (
    "userId" TEXT NOT NULL,
    "resourceRoleId" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserResourceRole_pkey" PRIMARY KEY ("userId","resourceRoleId")
);

-- CreateIndex
CREATE UNIQUE INDEX "ResourceRole_name_resourceType_resourceId_key" ON "public"."ResourceRole"("name", "resourceType", "resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "UserResourceRole_userId_resourceType_resourceId_key" ON "public"."UserResourceRole"("userId", "resourceType", "resourceId");

-- AddForeignKey
ALTER TABLE "public"."RolePermissionMap" ADD CONSTRAINT "RolePermissionMap_resourceRoleId_fkey" FOREIGN KEY ("resourceRoleId") REFERENCES "public"."ResourceRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserResourceRole" ADD CONSTRAINT "UserResourceRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserResourceRole" ADD CONSTRAINT "UserResourceRole_resourceRoleId_fkey" FOREIGN KEY ("resourceRoleId") REFERENCES "public"."ResourceRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
-- Make User.tenantId optional so platform users (SUPER_ADMIN) can have tenantId = null
ALTER TABLE "User" ALTER COLUMN "tenantId" DROP NOT NULL;

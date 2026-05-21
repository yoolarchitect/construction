-- AlterEnum (add BANNED to TenantStatus)
ALTER TYPE "TenantStatus" ADD VALUE 'BANNED';

-- CreateTable
CREATE TABLE "TenantPayment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reference" TEXT,
    "receiptNumber" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TenantPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TenantPayment_tenantId_idx" ON "TenantPayment"("tenantId");

-- CreateIndex
CREATE INDEX "TenantPayment_tenantId_paidAt_idx" ON "TenantPayment"("tenantId", "paidAt");

-- AddForeignKey
ALTER TABLE "TenantPayment" ADD CONSTRAINT "TenantPayment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

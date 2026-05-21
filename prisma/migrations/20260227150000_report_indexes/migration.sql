-- Report and archive queries: add indexes for tenant + client filter, expense date range, deleted filter, and expense item material filter.

-- Project: filter by tenant + client (report filters)
CREATE INDEX "Project_tenantId_clientId_idx" ON "Project"("tenantId", "clientId");

-- Expense: filter by tenant + date range and tenant + deletedAt (report date range, soft delete)
CREATE INDEX "Expense_tenantId_expenseDate_idx" ON "Expense"("tenantId", "expenseDate");
CREATE INDEX "Expense_tenantId_deletedAt_idx" ON "Expense"("tenantId", "deletedAt");

-- ExpenseItem: filter by expenseId + materials (report material/category filter)
CREATE INDEX "ExpenseItem_expenseId_materials_idx" ON "ExpenseItem"("expenseId", "materials");

-- Client: filter by tenant + deletedAt (report client dropdown)
CREATE INDEX "Client_tenantId_deletedAt_idx" ON "Client"("tenantId", "deletedAt");

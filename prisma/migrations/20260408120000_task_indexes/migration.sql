-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");
-- CreateIndex
CREATE INDEX "Task_priority_idx" ON "Task"("priority");
-- CreateIndex
CREATE INDEX "Task_dueDate_idx" ON "Task"("dueDate");
-- CreateIndex
CREATE INDEX "Task_createdAt_idx" ON "Task"("createdAt");

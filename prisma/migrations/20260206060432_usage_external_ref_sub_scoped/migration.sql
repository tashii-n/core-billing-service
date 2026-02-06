/*
  Warnings:

  - A unique constraint covering the columns `[subscription_id,external_ref]` on the table `usage_events` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "usage_events_org_id_external_ref_key";

-- CreateIndex
CREATE UNIQUE INDEX "usage_events_subscription_id_external_ref_key" ON "usage_events"("subscription_id", "external_ref");

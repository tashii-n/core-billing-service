-- CreateTable
CREATE TABLE "usage_counters" (
    "subscription_id" INTEGER NOT NULL,
    "metric" TEXT NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "success_count" BIGINT NOT NULL DEFAULT 0,
    "fail_count" BIGINT NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usage_counters_pkey" PRIMARY KEY ("subscription_id","metric","period_start","period_end")
);

-- CreateIndex
CREATE INDEX "usage_counters_subscription_id_period_start_period_end_idx" ON "usage_counters"("subscription_id", "period_start", "period_end");

-- AddForeignKey
ALTER TABLE "usage_counters" ADD CONSTRAINT "usage_counters_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("subscription_id") ON DELETE RESTRICT ON UPDATE CASCADE;

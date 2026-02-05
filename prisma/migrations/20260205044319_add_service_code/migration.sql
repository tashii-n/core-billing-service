/*
  Warnings:

  - The primary key for the `usage_counters` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `fail_count` on the `usage_counters` table. All the data in the column will be lost.
  - You are about to drop the column `metric` on the `usage_counters` table. All the data in the column will be lost.
  - You are about to drop the column `success_count` on the `usage_counters` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[service_code]` on the table `services` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `service_code` to the `services` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "SubscriptionStatus" ADD VALUE 'EXCEEDED_LIMIT';

-- AlterTable
ALTER TABLE "services" ADD COLUMN     "service_code" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "usage_counters" DROP CONSTRAINT "usage_counters_pkey",
DROP COLUMN "fail_count",
DROP COLUMN "metric",
DROP COLUMN "success_count",
ADD COLUMN     "count" INTEGER NOT NULL DEFAULT 0,
ADD CONSTRAINT "usage_counters_pkey" PRIMARY KEY ("subscription_id", "period_start", "period_end");

-- CreateIndex
CREATE UNIQUE INDEX "services_service_code_key" ON "services"("service_code");

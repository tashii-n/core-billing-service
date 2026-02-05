-- CreateEnum
CREATE TYPE "OrgType" AS ENUM ('SMALL', 'MEDIUM', 'LARGE', 'OTHER');

-- CreateEnum
CREATE TYPE "BillingModel" AS ENUM ('SUBSCRIPTION', 'PAY_PER_USE');

-- CreateEnum
CREATE TYPE "PlanCode" AS ENUM ('BASIC', 'PLUS', 'PREMIUM', 'ELITE', 'PAY_PER_USE');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELED', 'EXPIRED', 'EXCEEDED_LIMIT');

-- CreateEnum
CREATE TYPE "UsageResult" AS ENUM ('SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PAID', 'VOID', 'OVERDUE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "organizations" (
    "org_id" SERIAL NOT NULL,
    "orgId" TEXT NOT NULL,
    "org_did" TEXT NOT NULL,
    "org_name" TEXT NOT NULL,
    "org_type" "OrgType" NOT NULL,
    "client_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "redirect_url" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("org_id")
);

-- CreateTable
CREATE TABLE "services" (
    "service_id" SERIAL NOT NULL,
    "service_name" TEXT NOT NULL,
    "service_code" TEXT NOT NULL,
    "org_type_eligible" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("service_id")
);

-- CreateTable
CREATE TABLE "plans" (
    "plan_id" SERIAL NOT NULL,
    "service_id" INTEGER NOT NULL,
    "plan_code" "PlanCode" NOT NULL,
    "billing_period" TEXT NOT NULL,
    "billing_model" "BillingModel" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("plan_id")
);

-- CreateTable
CREATE TABLE "plan_prices" (
    "plan_price_id" SERIAL NOT NULL,
    "plan_id" INTEGER NOT NULL,
    "org_type" "OrgType",
    "currency" TEXT NOT NULL DEFAULT 'BTN',
    "fixed_fee" DECIMAL(12,2) NOT NULL,
    "effective_from" TIMESTAMP(3) NOT NULL,
    "effective_to" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_prices_pkey" PRIMARY KEY ("plan_price_id")
);

-- CreateTable
CREATE TABLE "plan_entitlements" (
    "entitlement_id" SERIAL NOT NULL,
    "plan_id" INTEGER NOT NULL,
    "org_type" "OrgType",
    "included_quantity" INTEGER NOT NULL,
    "overage_unit_price" DECIMAL(12,4),
    "hard_limit" BOOLEAN NOT NULL DEFAULT false,
    "period" TEXT NOT NULL,
    "effective_from" TIMESTAMP(3) NOT NULL,
    "effective_to" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_entitlements_pkey" PRIMARY KEY ("entitlement_id")
);

-- CreateTable
CREATE TABLE "plan_usage_rates" (
    "rate_id" SERIAL NOT NULL,
    "plan_id" INTEGER NOT NULL,
    "unit_price" DECIMAL(12,4) NOT NULL,
    "effective_from" TIMESTAMP(3) NOT NULL,
    "effective_to" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_usage_rates_pkey" PRIMARY KEY ("rate_id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "subscription_id" SERIAL NOT NULL,
    "org_id" INTEGER NOT NULL,
    "service_id" INTEGER NOT NULL,
    "plan_id" INTEGER NOT NULL,
    "status" "SubscriptionStatus" NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" TIMESTAMP(3),
    "current_period_start" TIMESTAMP(3),
    "current_period_end" TIMESTAMP(3),
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("subscription_id")
);

-- CreateTable
CREATE TABLE "usage_events" (
    "usage_id" SERIAL NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "org_id" INTEGER NOT NULL,
    "service_id" INTEGER NOT NULL,
    "subscription_id" INTEGER NOT NULL,
    "plan_id" INTEGER NOT NULL,
    "result" "UsageResult" NOT NULL,
    "external_ref" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_events_pkey" PRIMARY KEY ("usage_id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "invoice_id" SERIAL NOT NULL,
    "org_id" INTEGER NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "currency" TEXT NOT NULL DEFAULT 'BTN',
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "tax_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "issued_at" TIMESTAMP(3),
    "due_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("invoice_id")
);

-- CreateTable
CREATE TABLE "invoice_lines" (
    "line_id" SERIAL NOT NULL,
    "invoice_id" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(18,4),
    "unit_price" DECIMAL(12,4),
    "amount" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoice_lines_pkey" PRIMARY KEY ("line_id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "transaction_id" SERIAL NOT NULL,
    "invoice_id" INTEGER,
    "org_id" INTEGER NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BTN',
    "payment_status" "PaymentStatus" NOT NULL,
    "transaction_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reference" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("transaction_id")
);

-- CreateTable
CREATE TABLE "usage_counters" (
    "subscription_id" INTEGER NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usage_counters_pkey" PRIMARY KEY ("subscription_id","period_start","period_end")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_orgId_key" ON "organizations"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_org_did_key" ON "organizations"("org_did");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_org_name_key" ON "organizations"("org_name");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_client_id_key" ON "organizations"("client_id");

-- CreateIndex
CREATE UNIQUE INDEX "services_service_code_key" ON "services"("service_code");

-- CreateIndex
CREATE INDEX "plans_service_id_idx" ON "plans"("service_id");

-- CreateIndex
CREATE UNIQUE INDEX "plans_service_id_plan_code_key" ON "plans"("service_id", "plan_code");

-- CreateIndex
CREATE INDEX "plan_prices_plan_id_idx" ON "plan_prices"("plan_id");

-- CreateIndex
CREATE INDEX "plan_prices_plan_id_org_type_idx" ON "plan_prices"("plan_id", "org_type");

-- CreateIndex
CREATE INDEX "plan_entitlements_plan_id_idx" ON "plan_entitlements"("plan_id");

-- CreateIndex
CREATE INDEX "plan_entitlements_plan_id_org_type_idx" ON "plan_entitlements"("plan_id", "org_type");

-- CreateIndex
CREATE INDEX "plan_usage_rates_plan_id_idx" ON "plan_usage_rates"("plan_id");

-- CreateIndex
CREATE INDEX "subscriptions_org_id_service_id_status_idx" ON "subscriptions"("org_id", "service_id", "status");

-- CreateIndex
CREATE INDEX "subscriptions_plan_id_idx" ON "subscriptions"("plan_id");

-- CreateIndex
CREATE UNIQUE INDEX "usage_events_external_ref_key" ON "usage_events"("external_ref");

-- CreateIndex
CREATE INDEX "usage_events_subscription_id_occurred_at_idx" ON "usage_events"("subscription_id", "occurred_at");

-- CreateIndex
CREATE INDEX "usage_events_org_id_service_id_occurred_at_idx" ON "usage_events"("org_id", "service_id", "occurred_at");

-- CreateIndex
CREATE INDEX "invoices_org_id_status_idx" ON "invoices"("org_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_org_id_period_start_period_end_key" ON "invoices"("org_id", "period_start", "period_end");

-- CreateIndex
CREATE INDEX "invoice_lines_invoice_id_idx" ON "invoice_lines"("invoice_id");

-- CreateIndex
CREATE INDEX "transactions_org_id_transaction_date_idx" ON "transactions"("org_id", "transaction_date");

-- CreateIndex
CREATE INDEX "transactions_invoice_id_idx" ON "transactions"("invoice_id");

-- CreateIndex
CREATE INDEX "usage_counters_subscription_id_period_start_period_end_idx" ON "usage_counters"("subscription_id", "period_start", "period_end");

-- AddForeignKey
ALTER TABLE "plans" ADD CONSTRAINT "plans_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("service_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_prices" ADD CONSTRAINT "plan_prices_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("plan_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_entitlements" ADD CONSTRAINT "plan_entitlements_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("plan_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_usage_rates" ADD CONSTRAINT "plan_usage_rates_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("plan_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("org_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("service_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("plan_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("org_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("service_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("subscription_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("plan_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("org_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("invoice_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("invoice_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("org_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_counters" ADD CONSTRAINT "usage_counters_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("subscription_id") ON DELETE RESTRICT ON UPDATE CASCADE;

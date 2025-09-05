-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('owner', 'admin', 'member');

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "plan_type" VARCHAR(20) NOT NULL DEFAULT 'free',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "funnel_templates" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "template_data" JSONB NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "organization_id" UUID NOT NULL,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "funnel_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metric_datasets" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "dataset_type" VARCHAR(50) NOT NULL,
    "data_source" VARCHAR(50) NOT NULL,
    "config" JSONB NOT NULL,
    "organization_id" UUID NOT NULL,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "metric_datasets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "benchmark_data" (
    "id" TEXT NOT NULL,
    "industry" VARCHAR(100) NOT NULL,
    "metric_type" VARCHAR(100) NOT NULL,
    "metric_name" VARCHAR(100) NOT NULL,
    "value" DECIMAL(12,6) NOT NULL,
    "percentile" INTEGER NOT NULL,
    "sample_size" INTEGER NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "organization_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "benchmark_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "advice_rules" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "rule_type" VARCHAR(50) NOT NULL,
    "conditions" JSONB NOT NULL,
    "advice" JSONB NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "organization_id" UUID NOT NULL,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "advice_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_usage_limits" (
    "id" TEXT NOT NULL,
    "organization_id" UUID NOT NULL,
    "max_funnels" INTEGER NOT NULL DEFAULT 10,
    "max_templates" INTEGER NOT NULL DEFAULT 5,
    "max_users" INTEGER NOT NULL DEFAULT 5,
    "current_funnels" INTEGER NOT NULL DEFAULT 0,
    "current_templates" INTEGER NOT NULL DEFAULT 0,
    "current_users" INTEGER NOT NULL DEFAULT 0,
    "plan_type" VARCHAR(20) NOT NULL DEFAULT 'free',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "org_usage_limits_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "users" ADD COLUMN "organization_id" UUID,
ADD COLUMN "role" "user_role" NOT NULL DEFAULT 'member';

-- AlterTable
ALTER TABLE "funnels" ADD COLUMN "organization_id" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE INDEX "organizations_slug_idx" ON "organizations"("slug");

-- CreateIndex
CREATE INDEX "organizations_plan_type_idx" ON "organizations"("plan_type");

-- CreateIndex
CREATE INDEX "organizations_is_active_idx" ON "organizations"("is_active");

-- CreateIndex
CREATE INDEX "organizations_created_at_idx" ON "organizations"("created_at");

-- CreateIndex
CREATE INDEX "funnel_templates_organization_id_idx" ON "funnel_templates"("organization_id");

-- CreateIndex
CREATE INDEX "funnel_templates_created_by_idx" ON "funnel_templates"("created_by");

-- CreateIndex
CREATE INDEX "funnel_templates_is_default_idx" ON "funnel_templates"("is_default");

-- CreateIndex
CREATE INDEX "funnel_templates_created_at_idx" ON "funnel_templates"("created_at");

-- CreateIndex
CREATE INDEX "funnel_templates_name_idx" ON "funnel_templates"("name");

-- CreateIndex
CREATE INDEX "funnel_templates_organization_id_is_default_idx" ON "funnel_templates"("organization_id", "is_default");

-- CreateIndex
CREATE INDEX "metric_datasets_organization_id_idx" ON "metric_datasets"("organization_id");

-- CreateIndex
CREATE INDEX "metric_datasets_created_by_idx" ON "metric_datasets"("created_by");

-- CreateIndex
CREATE INDEX "metric_datasets_dataset_type_idx" ON "metric_datasets"("dataset_type");

-- CreateIndex
CREATE INDEX "metric_datasets_data_source_idx" ON "metric_datasets"("data_source");

-- CreateIndex
CREATE INDEX "metric_datasets_created_at_idx" ON "metric_datasets"("created_at");

-- CreateIndex
CREATE INDEX "metric_datasets_organization_id_dataset_type_idx" ON "metric_datasets"("organization_id", "dataset_type");

-- CreateIndex
CREATE UNIQUE INDEX "benchmark_data_industry_metric_type_metric_name_percentile_key" ON "benchmark_data"("industry", "metric_type", "metric_name", "percentile", "period_start", "period_end");

-- CreateIndex
CREATE INDEX "benchmark_data_organization_id_idx" ON "benchmark_data"("organization_id");

-- CreateIndex
CREATE INDEX "benchmark_data_industry_idx" ON "benchmark_data"("industry");

-- CreateIndex
CREATE INDEX "benchmark_data_metric_type_idx" ON "benchmark_data"("metric_type");

-- CreateIndex
CREATE INDEX "benchmark_data_metric_name_idx" ON "benchmark_data"("metric_name");

-- CreateIndex
CREATE INDEX "benchmark_data_percentile_idx" ON "benchmark_data"("percentile");

-- CreateIndex
CREATE INDEX "benchmark_data_period_start_period_end_idx" ON "benchmark_data"("period_start", "period_end");

-- CreateIndex
CREATE INDEX "benchmark_data_industry_metric_type_metric_name_idx" ON "benchmark_data"("industry", "metric_type", "metric_name");

-- CreateIndex
CREATE INDEX "advice_rules_organization_id_idx" ON "advice_rules"("organization_id");

-- CreateIndex
CREATE INDEX "advice_rules_created_by_idx" ON "advice_rules"("created_by");

-- CreateIndex
CREATE INDEX "advice_rules_rule_type_idx" ON "advice_rules"("rule_type");

-- CreateIndex
CREATE INDEX "advice_rules_priority_idx" ON "advice_rules"("priority");

-- CreateIndex
CREATE INDEX "advice_rules_is_active_idx" ON "advice_rules"("is_active");

-- CreateIndex
CREATE INDEX "advice_rules_organization_id_rule_type_is_active_idx" ON "advice_rules"("organization_id", "rule_type", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "org_usage_limits_organization_id_key" ON "org_usage_limits"("organization_id");

-- CreateIndex
CREATE INDEX "org_usage_limits_organization_id_idx" ON "org_usage_limits"("organization_id");

-- CreateIndex
CREATE INDEX "org_usage_limits_plan_type_idx" ON "org_usage_limits"("plan_type");

-- CreateIndex
CREATE INDEX "org_usage_limits_current_funnels_idx" ON "org_usage_limits"("current_funnels");

-- CreateIndex
CREATE INDEX "org_usage_limits_current_templates_idx" ON "org_usage_limits"("current_templates");

-- CreateIndex
CREATE INDEX "org_usage_limits_current_users_idx" ON "org_usage_limits"("current_users");

-- CreateIndex (New indexes for updated tables)
CREATE INDEX "users_organization_id_idx" ON "users"("organization_id");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "funnels_organization_id_idx" ON "funnels"("organization_id");

-- CreateIndex
CREATE INDEX "funnels_organization_id_status_idx" ON "funnels"("organization_id", "status");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funnels" ADD CONSTRAINT "funnels_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funnel_templates" ADD CONSTRAINT "funnel_templates_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funnel_templates" ADD CONSTRAINT "funnel_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metric_datasets" ADD CONSTRAINT "metric_datasets_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metric_datasets" ADD CONSTRAINT "metric_datasets_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benchmark_data" ADD CONSTRAINT "benchmark_data_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advice_rules" ADD CONSTRAINT "advice_rules_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advice_rules" ADD CONSTRAINT "advice_rules_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_usage_limits" ADD CONSTRAINT "org_usage_limits_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
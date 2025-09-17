-- Migration: Add Funnel Instance Tables and Support
-- Phase 1: Schema Extension (Non-Breaking)

-- Create new enum for funnel instance status
CREATE TYPE "funnel_instance_status" AS ENUM ('active', 'completed', 'archived', 'paused', 'draft');

-- Add new fields to existing funnels table (template support)
ALTER TABLE "funnels" 
ADD COLUMN "category" VARCHAR(50),
ADD COLUMN "industry" VARCHAR(50),
ADD COLUMN "is_public" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "instance_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "last_used_at" TIMESTAMPTZ(6);

-- Update existing funnels to be templates by default
UPDATE "funnels" SET "is_template" = true WHERE "is_template" = false;

-- Add indexes for new funnel fields
CREATE INDEX "funnels_category_idx" ON "funnels"("category");
CREATE INDEX "funnels_industry_idx" ON "funnels"("industry");
CREATE INDEX "funnels_is_public_idx" ON "funnels"("is_public");
CREATE INDEX "funnels_category_industry_idx" ON "funnels"("category", "industry");

-- Create funnel_instances table
CREATE TABLE "funnel_instances" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "funnel_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "organization_id" UUID,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "period_type" "metric_period_type" NOT NULL,
    "period_start_date" DATE NOT NULL,
    "period_end_date" DATE NOT NULL,
    "status" "funnel_instance_status" NOT NULL DEFAULT 'active',
    "data_completeness" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "last_data_entry" TIMESTAMPTZ(6),
    "target_conversion_rate" DECIMAL(5,4),
    "target_revenue" DECIMAL(12,2),
    "budget_allocated" DECIMAL(12,2),
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "completed_at" TIMESTAMPTZ(6),
    "archived_at" TIMESTAMPTZ(6),

    CONSTRAINT "funnel_instances_pkey" PRIMARY KEY ("id")
);

-- Add foreign keys for funnel_instances
ALTER TABLE "funnel_instances" ADD CONSTRAINT "funnel_instances_funnel_id_fkey" FOREIGN KEY ("funnel_id") REFERENCES "funnels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "funnel_instances" ADD CONSTRAINT "funnel_instances_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "funnel_instances" ADD CONSTRAINT "funnel_instances_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add unique constraint and indexes for funnel_instances
ALTER TABLE "funnel_instances" ADD CONSTRAINT "funnel_instances_funnel_id_user_id_period_start_date_period_type_key" UNIQUE ("funnel_id", "user_id", "period_start_date", "period_type");

CREATE INDEX "funnel_instances_funnel_id_idx" ON "funnel_instances"("funnel_id");
CREATE INDEX "funnel_instances_user_id_idx" ON "funnel_instances"("user_id");
CREATE INDEX "funnel_instances_organization_id_idx" ON "funnel_instances"("organization_id");
CREATE INDEX "funnel_instances_status_idx" ON "funnel_instances"("status");
CREATE INDEX "funnel_instances_period_type_idx" ON "funnel_instances"("period_type");
CREATE INDEX "funnel_instances_period_start_date_period_end_date_idx" ON "funnel_instances"("period_start_date", "period_end_date");
CREATE INDEX "funnel_instances_created_at_idx" ON "funnel_instances"("created_at");
CREATE INDEX "funnel_instances_last_data_entry_idx" ON "funnel_instances"("last_data_entry");
CREATE INDEX "funnel_instances_data_completeness_idx" ON "funnel_instances"("data_completeness");
CREATE INDEX "funnel_instances_funnel_id_status_idx" ON "funnel_instances"("funnel_id", "status");
CREATE INDEX "funnel_instances_user_id_status_idx" ON "funnel_instances"("user_id", "status");
CREATE INDEX "funnel_instances_organization_id_status_idx" ON "funnel_instances"("organization_id", "status");

-- Add new fields to nodes table (template support)
ALTER TABLE "nodes"
ADD COLUMN "configuration" JSONB,
ADD COLUMN "is_required" BOOLEAN NOT NULL DEFAULT true;

-- Add index for new node fields
CREATE INDEX "nodes_is_required_idx" ON "nodes"("is_required");

-- Create node_instances table
CREATE TABLE "node_instances" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "node_id" UUID NOT NULL,
    "funnel_instance_id" UUID NOT NULL,
    "custom_label" VARCHAR(100),
    "custom_config" JSONB,
    "current_entry_count" INTEGER NOT NULL DEFAULT 0,
    "current_converted_count" INTEGER NOT NULL DEFAULT 0,
    "current_conversion_rate" DECIMAL(5,4),
    "current_revenue" DECIMAL(12,2),
    "current_cost" DECIMAL(12,2),
    "has_data" BOOLEAN NOT NULL DEFAULT false,
    "last_updated" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),

    CONSTRAINT "node_instances_pkey" PRIMARY KEY ("id")
);

-- Add foreign keys for node_instances
ALTER TABLE "node_instances" ADD CONSTRAINT "node_instances_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "node_instances" ADD CONSTRAINT "node_instances_funnel_instance_id_fkey" FOREIGN KEY ("funnel_instance_id") REFERENCES "funnel_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add unique constraint and indexes for node_instances
ALTER TABLE "node_instances" ADD CONSTRAINT "node_instances_node_id_funnel_instance_id_key" UNIQUE ("node_id", "funnel_instance_id");

CREATE INDEX "node_instances_node_id_idx" ON "node_instances"("node_id");
CREATE INDEX "node_instances_funnel_instance_id_idx" ON "node_instances"("funnel_instance_id");
CREATE INDEX "node_instances_has_data_idx" ON "node_instances"("has_data");
CREATE INDEX "node_instances_last_updated_idx" ON "node_instances"("last_updated");
CREATE INDEX "node_instances_current_conversion_rate_idx" ON "node_instances"("current_conversion_rate");
CREATE INDEX "node_instances_current_revenue_idx" ON "node_instances"("current_revenue");

-- Add funnel_instance_id to funnel_metrics (nullable for now)
ALTER TABLE "funnel_metrics"
ADD COLUMN "funnel_instance_id" UUID,
ADD COLUMN "progress_to_target" DECIMAL(5,4),
ADD COLUMN "budget_utilization" DECIMAL(5,4),
ADD COLUMN "efficiency" DECIMAL(8,4);

-- Add foreign key for funnel_metrics
ALTER TABLE "funnel_metrics" ADD CONSTRAINT "funnel_metrics_funnel_instance_id_fkey" FOREIGN KEY ("funnel_instance_id") REFERENCES "funnel_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add indexes for new funnel_metrics fields
CREATE INDEX "funnel_metrics_funnel_instance_id_idx" ON "funnel_metrics"("funnel_instance_id");
CREATE INDEX "funnel_metrics_roi_idx" ON "funnel_metrics"("roi");
CREATE INDEX "funnel_metrics_efficiency_idx" ON "funnel_metrics"("efficiency");

-- Add node_instance_id to node_metrics (nullable for now)
ALTER TABLE "node_metrics"
ADD COLUMN "node_instance_id" UUID,
ADD COLUMN "retention_rate" DECIMAL(5,4),
ADD COLUMN "engagement_score" DECIMAL(5,4),
ADD COLUMN "quality_score" DECIMAL(5,4);

-- Add foreign key for node_metrics
ALTER TABLE "node_metrics" ADD CONSTRAINT "node_metrics_node_instance_id_fkey" FOREIGN KEY ("node_instance_id") REFERENCES "node_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add indexes for new node_metrics fields
CREATE INDEX "node_metrics_node_instance_id_idx" ON "node_metrics"("node_instance_id");
CREATE INDEX "node_metrics_retention_rate_idx" ON "node_metrics"("retention_rate");
CREATE INDEX "node_metrics_engagement_score_idx" ON "node_metrics"("engagement_score");

-- Add unique constraint for node_metrics with node_instance_id
ALTER TABLE "node_metrics" ADD CONSTRAINT "node_metrics_node_instance_id_period_type_period_start_date_key" UNIQUE ("node_instance_id", "period_type", "period_start_date");

-- Add funnel_instance_id to ai_sessions (nullable)
ALTER TABLE "ai_sessions"
ADD COLUMN "funnel_instance_id" UUID;

-- Add foreign key for ai_sessions
ALTER TABLE "ai_sessions" ADD CONSTRAINT "ai_sessions_funnel_instance_id_fkey" FOREIGN KEY ("funnel_instance_id") REFERENCES "funnel_instances"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add index for ai_sessions
CREATE INDEX "ai_sessions_funnel_instance_id_idx" ON "ai_sessions"("funnel_instance_id");

-- Update org_usage_limits to include funnel instance limits
ALTER TABLE "org_usage_limits"
ADD COLUMN "max_funnel_instances" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN "current_funnel_instances" INTEGER NOT NULL DEFAULT 0;

-- Add indexes for new usage limit fields
CREATE INDEX "org_usage_limits_current_funnel_instances_idx" ON "org_usage_limits"("current_funnel_instances");

-- Update updated_at trigger for new tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_funnel_instances_updated_at BEFORE UPDATE ON "funnel_instances" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_node_instances_updated_at BEFORE UPDATE ON "node_instances" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
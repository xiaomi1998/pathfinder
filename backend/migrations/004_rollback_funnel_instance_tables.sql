-- Rollback Migration: Remove Funnel Instance Tables and Support
-- Use this script to rollback the funnel-as-template migration

-- WARNING: This will permanently delete all funnel instance data!
-- Make sure to backup data before running this rollback.

-- Step 1: Drop triggers first
DROP TRIGGER IF EXISTS funnel_instance_count_trigger ON "funnel_instances";
DROP TRIGGER IF EXISTS org_instance_count_trigger ON "funnel_instances"; 
DROP TRIGGER IF EXISTS node_instance_data_status_trigger ON "node_instances";
DROP TRIGGER IF EXISTS update_funnel_instances_updated_at ON "funnel_instances";
DROP TRIGGER IF EXISTS update_node_instances_updated_at ON "node_instances";

-- Step 2: Drop trigger functions
DROP FUNCTION IF EXISTS update_funnel_instance_count();
DROP FUNCTION IF EXISTS update_org_instance_count(); 
DROP FUNCTION IF EXISTS update_node_instance_data_status();

-- Step 3: Drop views
DROP VIEW IF EXISTS "funnel_with_latest_instance";
DROP VIEW IF EXISTS "current_funnel_metrics";

-- Step 4: Remove foreign key constraints from funnel_metrics
ALTER TABLE "funnel_metrics" DROP CONSTRAINT IF EXISTS "funnel_metrics_funnel_instance_id_fkey";
ALTER TABLE "funnel_metrics" DROP CONSTRAINT IF EXISTS "funnel_metrics_funnel_instance_id_period_type_period_start_date_key";

-- Step 5: Remove foreign key constraints from node_metrics  
ALTER TABLE "node_metrics" DROP CONSTRAINT IF EXISTS "node_metrics_node_instance_id_fkey";
ALTER TABLE "node_metrics" DROP CONSTRAINT IF EXISTS "node_metrics_node_instance_id_period_type_period_start_date_key";

-- Step 6: Remove foreign key constraint from ai_sessions
ALTER TABLE "ai_sessions" DROP CONSTRAINT IF EXISTS "ai_sessions_funnel_instance_id_fkey";

-- Step 7: Drop node_instances table (this will cascade to node_metrics)
DROP TABLE IF EXISTS "node_instances" CASCADE;

-- Step 8: Drop funnel_instances table (this will cascade to funnel_metrics)  
DROP TABLE IF EXISTS "funnel_instances" CASCADE;

-- Step 9: Remove new columns from existing tables

-- Remove new columns from funnels table
ALTER TABLE "funnels" 
DROP COLUMN IF EXISTS "category",
DROP COLUMN IF EXISTS "industry", 
DROP COLUMN IF EXISTS "is_public",
DROP COLUMN IF EXISTS "instance_count",
DROP COLUMN IF EXISTS "last_used_at";

-- Remove new columns from nodes table
ALTER TABLE "nodes"
DROP COLUMN IF EXISTS "configuration",
DROP COLUMN IF EXISTS "is_required";

-- Remove new columns from funnel_metrics table
ALTER TABLE "funnel_metrics" 
DROP COLUMN IF EXISTS "funnel_instance_id",
DROP COLUMN IF EXISTS "progress_to_target",
DROP COLUMN IF EXISTS "budget_utilization", 
DROP COLUMN IF EXISTS "efficiency";

-- Remove new columns from node_metrics table
ALTER TABLE "node_metrics"
DROP COLUMN IF EXISTS "node_instance_id",
DROP COLUMN IF EXISTS "retention_rate",
DROP COLUMN IF EXISTS "engagement_score",
DROP COLUMN IF EXISTS "quality_score";

-- Remove new column from ai_sessions table
ALTER TABLE "ai_sessions" DROP COLUMN IF EXISTS "funnel_instance_id";

-- Remove new columns from org_usage_limits table
ALTER TABLE "org_usage_limits"
DROP COLUMN IF EXISTS "max_funnel_instances",
DROP COLUMN IF EXISTS "current_funnel_instances";

-- Step 10: Drop new indexes

-- Drop funnel indexes
DROP INDEX IF EXISTS "funnels_category_idx";
DROP INDEX IF EXISTS "funnels_industry_idx"; 
DROP INDEX IF EXISTS "funnels_is_public_idx";
DROP INDEX IF EXISTS "funnels_category_industry_idx";

-- Drop funnel_metrics indexes
DROP INDEX IF EXISTS "funnel_metrics_funnel_instance_id_idx";
DROP INDEX IF EXISTS "funnel_metrics_roi_idx";
DROP INDEX IF EXISTS "funnel_metrics_efficiency_idx";
DROP INDEX IF EXISTS "funnel_metrics_funnel_instance_id_period_type_period_start_date_idx";

-- Drop node_metrics indexes  
DROP INDEX IF EXISTS "node_metrics_node_instance_id_idx";
DROP INDEX IF EXISTS "node_metrics_retention_rate_idx";
DROP INDEX IF EXISTS "node_metrics_engagement_score_idx";

-- Drop nodes index
DROP INDEX IF EXISTS "nodes_is_required_idx";

-- Drop ai_sessions index
DROP INDEX IF EXISTS "ai_sessions_funnel_instance_id_idx";

-- Drop org_usage_limits index
DROP INDEX IF EXISTS "org_usage_limits_current_funnel_instances_idx";

-- Step 11: Restore original unique constraint for funnel_metrics
ALTER TABLE "funnel_metrics"
ADD CONSTRAINT "funnel_metrics_funnel_id_period_type_period_start_date_key" 
UNIQUE ("funnel_id", "period_type", "period_start_date");

-- Step 12: Restore original index for funnel_metrics
CREATE INDEX "funnel_metrics_funnel_id_period_type_period_start_date_idx"
ON "funnel_metrics"("funnel_id", "period_type", "period_start_date");

-- Step 13: Drop the new enum type
DROP TYPE IF EXISTS "funnel_instance_status";

-- Step 14: Reset funnel template flags to original state (optional)
-- This step is optional - you may want to keep some funnels as templates
-- UPDATE "funnels" SET "is_template" = false;

-- Step 15: Clean up audit log entries (optional)
DELETE FROM "audit_log" 
WHERE "new_values"->>'migration_type' IN ('funnel_to_template_instance', 'node_to_node_instance');

-- Step 16: Verification - Run these queries to verify rollback success

DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    -- Check if funnel_instances table exists (should be false)
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'funnel_instances'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE WARNING 'ROLLBACK INCOMPLETE: funnel_instances table still exists';
    ELSE
        RAISE NOTICE 'SUCCESS: funnel_instances table has been dropped';
    END IF;
    
    -- Check if node_instances table exists (should be false)
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'node_instances'  
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE WARNING 'ROLLBACK INCOMPLETE: node_instances table still exists';
    ELSE
        RAISE NOTICE 'SUCCESS: node_instances table has been dropped';
    END IF;
    
    -- Check if new columns were removed from funnel_metrics
    SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'funnel_metrics' 
        AND column_name = 'funnel_instance_id'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE WARNING 'ROLLBACK INCOMPLETE: funnel_instance_id column still exists in funnel_metrics';
    ELSE
        RAISE NOTICE 'SUCCESS: funnel_instance_id column removed from funnel_metrics';
    END IF;
    
    RAISE NOTICE 'Rollback verification completed. Check warnings for any issues.';
END $$;

-- Note: After running this rollback, you should also:
-- 1. Update your Prisma schema to remove the new models
-- 2. Regenerate Prisma client
-- 3. Update your TypeScript types to remove funnel instance types
-- 4. Update your services to use the old funnel structure
-- 5. Update your frontend components
-- 6. Run tests to ensure everything works with the old structure
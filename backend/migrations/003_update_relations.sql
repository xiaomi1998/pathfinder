-- Migration: Update Relations and Constraints
-- Phase 3: Make funnel_instance_id required and update constraints

-- Step 1: Verify all funnel_metrics have funnel_instance_id
-- Before making the field required, ensure all records are linked

DO $$
DECLARE
    unlinked_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO unlinked_count 
    FROM "funnel_metrics" 
    WHERE "funnel_instance_id" IS NULL;
    
    IF unlinked_count > 0 THEN
        RAISE EXCEPTION 'Cannot proceed: % funnel_metrics records are not linked to instances. Run data migration first.', unlinked_count;
    END IF;
    
    RAISE NOTICE 'All funnel_metrics are properly linked to instances. Proceeding with constraint updates.';
END $$;

-- Step 2: Verify all node_metrics have either node_instance_id or are legacy
-- We'll keep both for transition period

DO $$
DECLARE
    legacy_count INTEGER;
    instance_count INTEGER;
BEGIN
    SELECT 
        COUNT(CASE WHEN "node_instance_id" IS NULL THEN 1 END),
        COUNT(CASE WHEN "node_instance_id" IS NOT NULL THEN 1 END)
    INTO legacy_count, instance_count
    FROM "node_metrics";
    
    RAISE NOTICE 'Node metrics status: % legacy records, % instance-linked records', legacy_count, instance_count;
END $$;

-- Step 3: Make funnel_instance_id required in funnel_metrics
-- Update the column to be NOT NULL

ALTER TABLE "funnel_metrics" 
ALTER COLUMN "funnel_instance_id" SET NOT NULL;

-- Step 4: Drop old unique constraint and create new one based on funnel_instance_id
-- Remove the old constraint that uses funnel_id

ALTER TABLE "funnel_metrics" 
DROP CONSTRAINT IF EXISTS "funnel_metrics_funnel_id_period_type_period_start_date_key";

-- Add new unique constraint based on funnel_instance_id
ALTER TABLE "funnel_metrics"
ADD CONSTRAINT "funnel_metrics_funnel_instance_id_period_type_period_start_date_key" 
UNIQUE ("funnel_instance_id", "period_type", "period_start_date");

-- Step 5: Update indexes for better performance
-- Drop old index and create optimized ones

DROP INDEX IF EXISTS "funnel_metrics_funnel_id_period_type_period_start_date_idx";

CREATE INDEX "funnel_metrics_funnel_instance_id_period_type_period_start_date_idx" 
ON "funnel_metrics"("funnel_instance_id", "period_type", "period_start_date");

-- Step 6: Add check constraints for data integrity
-- Ensure period dates are logical

ALTER TABLE "funnel_instances"
ADD CONSTRAINT "funnel_instances_period_dates_check" 
CHECK ("period_end_date" >= "period_start_date");

ALTER TABLE "funnel_instances" 
ADD CONSTRAINT "funnel_instances_data_completeness_check"
CHECK ("data_completeness" >= 0.0 AND "data_completeness" <= 1.0);

ALTER TABLE "funnel_instances"
ADD CONSTRAINT "funnel_instances_target_conversion_rate_check"
CHECK ("target_conversion_rate" IS NULL OR ("target_conversion_rate" >= 0 AND "target_conversion_rate" <= 1));

-- Step 7: Add check constraints for node instances
-- Ensure entry and conversion counts are logical

ALTER TABLE "node_instances"
ADD CONSTRAINT "node_instances_conversion_count_check"
CHECK ("current_converted_count" <= "current_entry_count");

ALTER TABLE "node_instances"
ADD CONSTRAINT "node_instances_conversion_rate_check" 
CHECK ("current_conversion_rate" IS NULL OR ("current_conversion_rate" >= 0 AND "current_conversion_rate" <= 1));

-- Step 8: Create optimized composite indexes for common queries
-- These indexes support the most common query patterns

-- Index for instance status and period queries
CREATE INDEX "funnel_instances_status_period_idx"
ON "funnel_instances"("status", "period_start_date", "period_end_date");

-- Index for user's active instances
CREATE INDEX "funnel_instances_user_active_idx"
ON "funnel_instances"("user_id", "status") 
WHERE "status" IN ('active', 'completed');

-- Index for organization instance tracking
CREATE INDEX "funnel_instances_org_tracking_idx"
ON "funnel_instances"("organization_id", "status", "created_at");

-- Index for template usage tracking
CREATE INDEX "funnels_template_usage_idx"
ON "funnels"("is_template", "instance_count", "last_used_at")
WHERE "is_template" = true;

-- Index for node instance performance queries
CREATE INDEX "node_instances_performance_idx"
ON "node_instances"("funnel_instance_id", "has_data", "current_conversion_rate");

-- Step 9: Create views for backward compatibility
-- These views help maintain API compatibility during transition

CREATE OR REPLACE VIEW "funnel_with_latest_instance" AS
SELECT 
    f.*,
    fi."id" as "latest_instance_id",
    fi."name" as "latest_instance_name",
    fi."status" as "latest_instance_status",
    fi."period_start_date" as "latest_period_start",
    fi."period_end_date" as "latest_period_end",
    fi."data_completeness"
FROM "funnels" f
LEFT JOIN LATERAL (
    SELECT fi2.*
    FROM "funnel_instances" fi2
    WHERE fi2."funnel_id" = f."id"
    ORDER BY fi2."created_at" DESC
    LIMIT 1
) fi ON true;

-- View for current period metrics
CREATE OR REPLACE VIEW "current_funnel_metrics" AS
SELECT 
    fm.*,
    fi."name" as "instance_name",
    fi."status" as "instance_status",
    f."name" as "template_name"
FROM "funnel_metrics" fm
INNER JOIN "funnel_instances" fi ON fm."funnel_instance_id" = fi."id"
INNER JOIN "funnels" f ON fi."funnel_id" = f."id"
WHERE fi."status" IN ('active', 'completed');

-- Step 10: Update triggers for maintaining derived data
-- Triggers to keep instance counts and completion status up to date

CREATE OR REPLACE FUNCTION update_funnel_instance_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE "funnels" 
        SET "instance_count" = "instance_count" + 1,
            "last_used_at" = NEW."created_at"
        WHERE "id" = NEW."funnel_id";
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE "funnels" 
        SET "instance_count" = "instance_count" - 1
        WHERE "id" = OLD."funnel_id";
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER funnel_instance_count_trigger
    AFTER INSERT OR DELETE ON "funnel_instances"
    FOR EACH ROW EXECUTE FUNCTION update_funnel_instance_count();

-- Trigger to update org usage limits
CREATE OR REPLACE FUNCTION update_org_instance_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE "org_usage_limits"
        SET "current_funnel_instances" = "current_funnel_instances" + 1
        WHERE "organization_id" = NEW."organization_id";
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN  
        UPDATE "org_usage_limits"
        SET "current_funnel_instances" = "current_funnel_instances" - 1
        WHERE "organization_id" = OLD."organization_id";
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' AND OLD."organization_id" != NEW."organization_id" THEN
        -- Handle organization change
        UPDATE "org_usage_limits"
        SET "current_funnel_instances" = "current_funnel_instances" - 1
        WHERE "organization_id" = OLD."organization_id";
        
        UPDATE "org_usage_limits"
        SET "current_funnel_instances" = "current_funnel_instances" + 1  
        WHERE "organization_id" = NEW."organization_id";
        RETURN NEW;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER org_instance_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON "funnel_instances"
    FOR EACH ROW EXECUTE FUNCTION update_org_instance_count();

-- Trigger to update node instance data status
CREATE OR REPLACE FUNCTION update_node_instance_data_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update has_data flag based on whether any meaningful data exists
    NEW."has_data" = (
        NEW."current_entry_count" > 0 OR 
        NEW."current_converted_count" > 0 OR
        NEW."current_revenue" IS NOT NULL OR
        NEW."current_cost" IS NOT NULL
    );
    
    -- Update last_updated timestamp
    NEW."last_updated" = NOW();
    
    -- Update funnel instance data completeness
    UPDATE "funnel_instances"
    SET "data_completeness" = (
        SELECT CASE 
            WHEN COUNT(ni."id") = 0 THEN 0.0
            ELSE COUNT(CASE WHEN ni."has_data" THEN 1 END)::FLOAT / COUNT(ni."id")::FLOAT  
        END
        FROM "node_instances" ni
        WHERE ni."funnel_instance_id" = NEW."funnel_instance_id"
    ),
    "last_data_entry" = GREATEST(COALESCE("last_data_entry", '1900-01-01'::timestamptz), NEW."last_updated")
    WHERE "id" = NEW."funnel_instance_id";
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER node_instance_data_status_trigger
    BEFORE UPDATE ON "node_instances"  
    FOR EACH ROW EXECUTE FUNCTION update_node_instance_data_status();

-- Step 11: Add comments for documentation
-- Document the new schema structure

COMMENT ON TABLE "funnel_instances" IS 'Specific instances of funnel templates with actual data and time periods';
COMMENT ON TABLE "node_instances" IS 'Node instances within funnel instances, containing actual performance data';

COMMENT ON COLUMN "funnels"."is_template" IS 'Always true - funnels are now templates only';
COMMENT ON COLUMN "funnels"."instance_count" IS 'Number of instances created from this template';
COMMENT ON COLUMN "funnels"."is_public" IS 'Whether this template can be shared across organizations';

COMMENT ON COLUMN "funnel_instances"."data_completeness" IS 'Percentage of nodes with data (0.0 to 1.0)';
COMMENT ON COLUMN "funnel_instances"."status" IS 'Current status of data collection for this instance';

COMMENT ON COLUMN "node_instances"."has_data" IS 'Whether this node instance has any meaningful data';
COMMENT ON COLUMN "node_instances"."current_conversion_rate" IS 'Latest conversion rate for quick access';

-- Final verification
DO $$
DECLARE
    instance_count INTEGER;
    metrics_count INTEGER;
    node_instance_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO instance_count FROM "funnel_instances";
    SELECT COUNT(*) INTO metrics_count FROM "funnel_metrics" WHERE "funnel_instance_id" IS NOT NULL;  
    SELECT COUNT(*) INTO node_instance_count FROM "node_instances";
    
    RAISE NOTICE 'Migration completed successfully:';
    RAISE NOTICE '  - Funnel instances: %', instance_count;
    RAISE NOTICE '  - Linked funnel metrics: %', metrics_count; 
    RAISE NOTICE '  - Node instances: %', node_instance_count;
END $$;
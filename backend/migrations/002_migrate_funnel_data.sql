-- Migration: Migrate Existing Funnel Data to Template-Instance Model
-- Phase 2: Data Migration

-- Step 1: Create funnel instances for existing funnels with metrics
-- This creates instances for funnels that have actual usage data

INSERT INTO "funnel_instances" (
    "id",
    "funnel_id", 
    "user_id",
    "organization_id",
    "name",
    "description", 
    "period_type",
    "period_start_date",
    "period_end_date",
    "status",
    "data_completeness",
    "last_data_entry",
    "notes",
    "created_at",
    "updated_at"
)
SELECT 
    gen_random_uuid() as "id",
    f."id" as "funnel_id",
    f."user_id",
    f."organization_id",
    f."name" || ' - Instance ' || fm."period_type" || ' ' || fm."period_start_date" as "name",
    'Auto-generated instance from existing funnel data' as "description",
    fm."period_type",
    fm."period_start_date", 
    fm."period_end_date",
    CASE 
        WHEN fm."period_end_date" < CURRENT_DATE THEN 'completed'::funnel_instance_status
        ELSE 'active'::funnel_instance_status
    END as "status",
    CASE 
        WHEN COUNT(nm."id") > 0 THEN LEAST(1.0, COUNT(nm."id")::FLOAT / GREATEST(1, (SELECT COUNT(*) FROM "nodes" WHERE "funnel_id" = f."id")))
        ELSE 0.0
    END as "data_completeness",
    GREATEST(fm."updated_at", COALESCE(MAX(nm."updated_at"), fm."updated_at")) as "last_data_entry",
    fm."notes",
    fm."created_at",
    fm."updated_at"
FROM "funnels" f
INNER JOIN "funnel_metrics" fm ON f."id" = fm."funnel_id"
LEFT JOIN "nodes" n ON f."id" = n."funnel_id"
LEFT JOIN "node_metrics" nm ON n."id" = nm."node_id" 
    AND nm."period_type" = fm."period_type"
    AND nm."period_start_date" = fm."period_start_date"
WHERE f."is_template" = true -- Only migrate template funnels with data
GROUP BY f."id", f."user_id", f."organization_id", f."name", fm."id", fm."period_type", 
         fm."period_start_date", fm."period_end_date", fm."notes", fm."created_at", fm."updated_at";

-- Step 2: Create node instances for each funnel instance
-- This links template nodes to their corresponding instances

INSERT INTO "node_instances" (
    "id",
    "node_id",
    "funnel_instance_id", 
    "custom_label",
    "current_entry_count",
    "current_converted_count", 
    "current_conversion_rate",
    "current_revenue",
    "current_cost",
    "has_data",
    "last_updated",
    "created_at",
    "updated_at"
)
SELECT 
    gen_random_uuid() as "id",
    n."id" as "node_id",
    fi."id" as "funnel_instance_id",
    n."label" as "custom_label",
    COALESCE(nm."entry_count", 0) as "current_entry_count",
    COALESCE(nm."converted_count", 0) as "current_converted_count", 
    nm."conversion_rate" as "current_conversion_rate",
    nm."revenue" as "current_revenue",
    nm."cost" as "current_cost",
    CASE WHEN nm."id" IS NOT NULL THEN true ELSE false END as "has_data",
    nm."updated_at" as "last_updated",
    COALESCE(nm."created_at", fi."created_at") as "created_at",
    COALESCE(nm."updated_at", fi."updated_at") as "updated_at"
FROM "funnel_instances" fi
INNER JOIN "nodes" n ON fi."funnel_id" = n."funnel_id"
LEFT JOIN "node_metrics" nm ON n."id" = nm."node_id"
    AND nm."period_type" = fi."period_type"
    AND nm."period_start_date" = fi."period_start_date";

-- Step 3: Update funnel_metrics to link to funnel instances
-- This connects existing metrics to their corresponding instances

UPDATE "funnel_metrics" 
SET "funnel_instance_id" = fi."id"
FROM "funnel_instances" fi
WHERE "funnel_metrics"."funnel_id" = fi."funnel_id"
    AND "funnel_metrics"."period_type" = fi."period_type"
    AND "funnel_metrics"."period_start_date" = fi."period_start_date";

-- Step 4: Update node_metrics to link to node instances  
-- This connects existing node metrics to their corresponding node instances

UPDATE "node_metrics"
SET "node_instance_id" = ni."id"
FROM "node_instances" ni
INNER JOIN "funnel_instances" fi ON ni."funnel_instance_id" = fi."id"
WHERE "node_metrics"."node_id" = ni."node_id"
    AND "node_metrics"."period_type" = fi."period_type" 
    AND "node_metrics"."period_start_date" = fi."period_start_date";

-- Step 5: Update instance counts in funnels table
-- Track how many instances each template has

UPDATE "funnels" 
SET "instance_count" = (
    SELECT COUNT(*)
    FROM "funnel_instances" 
    WHERE "funnel_instances"."funnel_id" = "funnels"."id"
),
"last_used_at" = (
    SELECT MAX("created_at")
    FROM "funnel_instances"
    WHERE "funnel_instances"."funnel_id" = "funnels"."id"
);

-- Step 6: Update usage limits to reflect current instance counts
-- Update organization usage limits with actual counts

UPDATE "org_usage_limits"
SET "current_funnel_instances" = (
    SELECT COUNT(*)
    FROM "funnel_instances" fi
    WHERE fi."organization_id" = "org_usage_limits"."organization_id"
);

-- Step 7: Calculate enhanced metrics for funnel_metrics
-- Add progress to target and efficiency calculations

UPDATE "funnel_metrics" 
SET 
    "efficiency" = CASE 
        WHEN "total_cost" IS NOT NULL AND "total_cost" > 0 AND "total_revenue" IS NOT NULL 
        THEN "total_revenue" / "total_cost"
        ELSE NULL
    END,
    "progress_to_target" = CASE
        WHEN fi."target_conversion_rate" IS NOT NULL AND fi."target_conversion_rate" > 0
        THEN LEAST(1.0, "overall_conversion_rate" / fi."target_conversion_rate")
        ELSE NULL
    END,
    "budget_utilization" = CASE
        WHEN fi."budget_allocated" IS NOT NULL AND fi."budget_allocated" > 0 AND "total_cost" IS NOT NULL
        THEN LEAST(1.0, "total_cost" / fi."budget_allocated")
        ELSE NULL
    END
FROM "funnel_instances" fi
WHERE "funnel_metrics"."funnel_instance_id" = fi."id";

-- Step 8: Set default targets for instances without explicit targets
-- Use historical averages as baseline targets

UPDATE "funnel_instances"
SET 
    "target_conversion_rate" = COALESCE(
        "target_conversion_rate",
        (SELECT AVG("overall_conversion_rate") 
         FROM "funnel_metrics" fm 
         WHERE fm."funnel_instance_id" = "funnel_instances"."id" 
         AND "overall_conversion_rate" IS NOT NULL)
    ),
    "target_revenue" = COALESCE(
        "target_revenue", 
        (SELECT AVG("total_revenue")
         FROM "funnel_metrics" fm
         WHERE fm."funnel_instance_id" = "funnel_instances"."id"
         AND "total_revenue" IS NOT NULL)
    );

-- Step 9: Update data completeness for funnel instances
-- Calculate accurate completeness based on node instances with data

UPDATE "funnel_instances"
SET "data_completeness" = (
    SELECT CASE 
        WHEN COUNT(ni."id") = 0 THEN 0.0
        ELSE COUNT(CASE WHEN ni."has_data" THEN 1 END)::FLOAT / COUNT(ni."id")::FLOAT
    END
    FROM "node_instances" ni
    WHERE ni."funnel_instance_id" = "funnel_instances"."id"
);

-- Step 10: Create audit trail for migration
-- Record the migration for tracking purposes

INSERT INTO "audit_log" ("table_name", "operation", "new_values", "user_id", "timestamp")
VALUES 
    ('funnel_instances', 'INSERT', 
     json_build_object(
         'migration_type', 'funnel_to_template_instance',
         'records_created', (SELECT COUNT(*) FROM "funnel_instances"),
         'migration_date', NOW()
     ), 
     NULL, NOW()),
    ('node_instances', 'INSERT',
     json_build_object(
         'migration_type', 'node_to_node_instance', 
         'records_created', (SELECT COUNT(*) FROM "node_instances"),
         'migration_date', NOW()
     ),
     NULL, NOW());

-- Verification queries (commented out - run manually to verify)
/*
-- Verify funnel instances were created
SELECT 
    f.name as funnel_name,
    COUNT(fi.id) as instance_count,
    AVG(fi.data_completeness) as avg_completeness
FROM funnels f
LEFT JOIN funnel_instances fi ON f.id = fi.funnel_id
GROUP BY f.id, f.name
ORDER BY instance_count DESC;

-- Verify node instances were created  
SELECT
    COUNT(ni.id) as total_node_instances,
    COUNT(CASE WHEN ni.has_data THEN 1 END) as instances_with_data,
    AVG(CASE WHEN ni.has_data THEN 1.0 ELSE 0.0 END) as data_percentage
FROM node_instances ni;

-- Verify metrics are properly linked
SELECT 
    COUNT(fm.id) as funnel_metrics_count,
    COUNT(fm.funnel_instance_id) as linked_to_instances,
    COUNT(nm.id) as node_metrics_count, 
    COUNT(nm.node_instance_id) as node_metrics_linked
FROM funnel_metrics fm
FULL OUTER JOIN node_metrics nm ON true;
*/
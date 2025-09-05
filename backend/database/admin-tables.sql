-- SQL script to create admin and AI usage tables manually
-- Run this if Prisma migrations are not available

-- Create admin role enum
DO $$ BEGIN
    CREATE TYPE "admin_role" AS ENUM ('super_admin', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create AI usage type enum
DO $$ BEGIN
    CREATE TYPE "ai_usage_type" AS ENUM ('chat', 'analysis', 'recommendation', 'general');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create admin_users table
CREATE TABLE IF NOT EXISTS "admin_users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "username" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(50),
    "last_name" VARCHAR(50),
    "role" "admin_role" NOT NULL DEFAULT 'admin',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login_at" TIMESTAMPTZ(6),

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- Create unique constraints for admin_users
CREATE UNIQUE INDEX IF NOT EXISTS "admin_users_username_key" ON "admin_users"("username");
CREATE UNIQUE INDEX IF NOT EXISTS "admin_users_email_key" ON "admin_users"("email");

-- Create indexes for admin_users
CREATE INDEX IF NOT EXISTS "admin_users_email_idx" ON "admin_users"("email");
CREATE INDEX IF NOT EXISTS "admin_users_username_idx" ON "admin_users"("username");
CREATE INDEX IF NOT EXISTS "admin_users_role_idx" ON "admin_users"("role");
CREATE INDEX IF NOT EXISTS "admin_users_is_active_idx" ON "admin_users"("is_active");

-- Create user_ai_usage table
CREATE TABLE IF NOT EXISTS "user_ai_usage" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "session_id" UUID,
    "usage_type" "ai_usage_type" NOT NULL,
    "request_count" INTEGER NOT NULL DEFAULT 1,
    "token_count" INTEGER,
    "cost" DECIMAL(10,4),
    "usage_date" DATE NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_ai_usage_pkey" PRIMARY KEY ("id")
);

-- Create indexes for user_ai_usage
CREATE INDEX IF NOT EXISTS "user_ai_usage_user_id_idx" ON "user_ai_usage"("user_id");
CREATE INDEX IF NOT EXISTS "user_ai_usage_session_id_idx" ON "user_ai_usage"("session_id");
CREATE INDEX IF NOT EXISTS "user_ai_usage_usage_date_idx" ON "user_ai_usage"("usage_date");
CREATE INDEX IF NOT EXISTS "user_ai_usage_usage_type_idx" ON "user_ai_usage"("usage_type");
CREATE INDEX IF NOT EXISTS "user_ai_usage_user_id_usage_date_idx" ON "user_ai_usage"("user_id", "usage_date");
CREATE INDEX IF NOT EXISTS "user_ai_usage_usage_date_usage_type_idx" ON "user_ai_usage"("usage_date", "usage_type");

-- Create user_ai_limits table
CREATE TABLE IF NOT EXISTS "user_ai_limits" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "daily_limit" INTEGER NOT NULL DEFAULT 100,
    "monthly_limit" INTEGER NOT NULL DEFAULT 3000,
    "current_daily" INTEGER NOT NULL DEFAULT 0,
    "current_monthly" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_reset_daily" DATE NOT NULL DEFAULT CURRENT_DATE,
    "last_reset_monthly" DATE NOT NULL DEFAULT CURRENT_DATE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_ai_limits_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint for user_ai_limits
CREATE UNIQUE INDEX IF NOT EXISTS "user_ai_limits_user_id_key" ON "user_ai_limits"("user_id");

-- Create indexes for user_ai_limits
CREATE INDEX IF NOT EXISTS "user_ai_limits_user_id_idx" ON "user_ai_limits"("user_id");
CREATE INDEX IF NOT EXISTS "user_ai_limits_is_active_idx" ON "user_ai_limits"("is_active");
CREATE INDEX IF NOT EXISTS "user_ai_limits_last_reset_daily_idx" ON "user_ai_limits"("last_reset_daily");
CREATE INDEX IF NOT EXISTS "user_ai_limits_last_reset_monthly_idx" ON "user_ai_limits"("last_reset_monthly");

-- Create admin_operation_logs table
CREATE TABLE IF NOT EXISTS "admin_operation_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "admin_id" UUID NOT NULL,
    "target_type" VARCHAR(50) NOT NULL,
    "target_id" UUID,
    "operation" VARCHAR(100) NOT NULL,
    "old_values" JSONB,
    "new_values" JSONB,
    "result" VARCHAR(20),
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_operation_logs_pkey" PRIMARY KEY ("id")
);

-- Create indexes for admin_operation_logs
CREATE INDEX IF NOT EXISTS "admin_operation_logs_admin_id_idx" ON "admin_operation_logs"("admin_id");
CREATE INDEX IF NOT EXISTS "admin_operation_logs_target_type_idx" ON "admin_operation_logs"("target_type");
CREATE INDEX IF NOT EXISTS "admin_operation_logs_target_id_idx" ON "admin_operation_logs"("target_id");
CREATE INDEX IF NOT EXISTS "admin_operation_logs_created_at_idx" ON "admin_operation_logs"("created_at");
CREATE INDEX IF NOT EXISTS "admin_operation_logs_result_idx" ON "admin_operation_logs"("result");

-- Add foreign key constraints
ALTER TABLE "user_ai_usage" 
ADD CONSTRAINT IF NOT EXISTS "user_ai_usage_user_id_fkey" 
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_ai_usage" 
ADD CONSTRAINT IF NOT EXISTS "user_ai_usage_session_id_fkey" 
FOREIGN KEY ("session_id") REFERENCES "ai_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "user_ai_limits" 
ADD CONSTRAINT IF NOT EXISTS "user_ai_limits_user_id_fkey" 
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "admin_operation_logs" 
ADD CONSTRAINT IF NOT EXISTS "admin_operation_logs_admin_id_fkey" 
FOREIGN KEY ("admin_id") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables
DROP TRIGGER IF EXISTS update_admin_users_updated_at ON "admin_users";
CREATE TRIGGER update_admin_users_updated_at 
    BEFORE UPDATE ON "admin_users" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_ai_limits_updated_at ON "user_ai_limits";
CREATE TRIGGER update_user_ai_limits_updated_at 
    BEFORE UPDATE ON "user_ai_limits" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;
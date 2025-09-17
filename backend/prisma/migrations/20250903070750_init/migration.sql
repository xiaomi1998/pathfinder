-- CreateEnum
CREATE TYPE "funnel_status" AS ENUM ('active', 'archived', 'template');

-- CreateEnum
CREATE TYPE "node_type" AS ENUM ('awareness', 'acquisition', 'activation', 'revenue', 'retention');

-- CreateEnum
CREATE TYPE "session_context" AS ENUM ('invitation', 'objection_handling', 'general');

-- CreateEnum
CREATE TYPE "message_role" AS ENUM ('user', 'assistant');

-- CreateEnum
CREATE TYPE "audit_operation" AS ENUM ('INSERT', 'UPDATE', 'DELETE');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "username" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(50),
    "last_name" VARCHAR(50),
    "avatar" VARCHAR(500),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "last_login_at" TIMESTAMPTZ(6),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_email_verified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "funnels" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "canvas_data" JSONB,
    "status" "funnel_status" NOT NULL DEFAULT 'active',
    "is_template" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "funnels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nodes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "funnel_id" UUID NOT NULL,
    "node_type" "node_type" NOT NULL,
    "label" VARCHAR(30) NOT NULL DEFAULT '新节点',
    "position_x" DECIMAL(10,2) NOT NULL,
    "position_y" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "edges" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "funnel_id" UUID NOT NULL,
    "source_node_id" UUID NOT NULL,
    "target_node_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "edges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "node_data" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "node_id" UUID NOT NULL,
    "week_start_date" DATE NOT NULL,
    "entry_count" INTEGER NOT NULL DEFAULT 0,
    "converted_count" INTEGER NOT NULL DEFAULT 0,
    "conversion_rate" DECIMAL(5,4),
    "bounce_count" INTEGER DEFAULT 0,
    "avg_time_spent" INTEGER,
    "revenue" DECIMAL(12,2),
    "cost" DECIMAL(12,2),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "node_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "funnel_id" UUID,
    "session_context" "session_context",
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMPTZ(6),

    CONSTRAINT "ai_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" UUID NOT NULL,
    "role" "message_role" NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "table_name" VARCHAR(50) NOT NULL,
    "operation" "audit_operation" NOT NULL,
    "old_values" JSONB,
    "new_values" JSONB,
    "user_id" UUID,
    "timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_created_at_idx" ON "users"("created_at");

-- CreateIndex
CREATE INDEX "users_last_login_at_idx" ON "users"("last_login_at");

-- CreateIndex
CREATE INDEX "users_is_active_idx" ON "users"("is_active");

-- CreateIndex
CREATE INDEX "users_username_first_name_last_name_idx" ON "users"("username", "first_name", "last_name");

-- CreateIndex
CREATE INDEX "funnels_user_id_idx" ON "funnels"("user_id");

-- CreateIndex
CREATE INDEX "funnels_created_at_idx" ON "funnels"("created_at");

-- CreateIndex
CREATE INDEX "funnels_name_idx" ON "funnels"("name");

-- CreateIndex
CREATE INDEX "funnels_status_idx" ON "funnels"("status");

-- CreateIndex
CREATE INDEX "funnels_is_template_idx" ON "funnels"("is_template");

-- CreateIndex
CREATE INDEX "funnels_tags_idx" ON "funnels"("tags");

-- CreateIndex
CREATE INDEX "funnels_user_id_status_idx" ON "funnels"("user_id", "status");

-- CreateIndex
CREATE INDEX "nodes_funnel_id_idx" ON "nodes"("funnel_id");

-- CreateIndex
CREATE INDEX "nodes_node_type_idx" ON "nodes"("node_type");

-- CreateIndex
CREATE INDEX "nodes_position_x_position_y_idx" ON "nodes"("position_x", "position_y");

-- CreateIndex
CREATE INDEX "edges_funnel_id_idx" ON "edges"("funnel_id");

-- CreateIndex
CREATE INDEX "edges_source_node_id_idx" ON "edges"("source_node_id");

-- CreateIndex
CREATE INDEX "edges_target_node_id_idx" ON "edges"("target_node_id");

-- CreateIndex
CREATE INDEX "edges_source_node_id_target_node_id_idx" ON "edges"("source_node_id", "target_node_id");

-- CreateIndex
CREATE UNIQUE INDEX "edges_source_node_id_target_node_id_key" ON "edges"("source_node_id", "target_node_id");

-- CreateIndex
CREATE INDEX "node_data_node_id_idx" ON "node_data"("node_id");

-- CreateIndex
CREATE INDEX "node_data_week_start_date_idx" ON "node_data"("week_start_date");

-- CreateIndex
CREATE INDEX "node_data_created_at_idx" ON "node_data"("created_at");

-- CreateIndex
CREATE INDEX "node_data_conversion_rate_idx" ON "node_data"("conversion_rate");

-- CreateIndex
CREATE INDEX "node_data_revenue_idx" ON "node_data"("revenue");

-- CreateIndex
CREATE INDEX "node_data_node_id_week_start_date_conversion_rate_idx" ON "node_data"("node_id", "week_start_date", "conversion_rate");

-- CreateIndex
CREATE UNIQUE INDEX "node_data_node_id_week_start_date_key" ON "node_data"("node_id", "week_start_date");

-- CreateIndex
CREATE INDEX "ai_sessions_user_id_idx" ON "ai_sessions"("user_id");

-- CreateIndex
CREATE INDEX "ai_sessions_created_at_idx" ON "ai_sessions"("created_at");

-- CreateIndex
CREATE INDEX "ai_sessions_funnel_id_idx" ON "ai_sessions"("funnel_id");

-- CreateIndex
CREATE INDEX "ai_sessions_session_context_idx" ON "ai_sessions"("session_context");

-- CreateIndex
CREATE INDEX "ai_messages_session_id_idx" ON "ai_messages"("session_id");

-- CreateIndex
CREATE INDEX "ai_messages_created_at_idx" ON "ai_messages"("created_at");

-- CreateIndex
CREATE INDEX "ai_messages_role_idx" ON "ai_messages"("role");

-- CreateIndex
CREATE INDEX "audit_log_table_name_idx" ON "audit_log"("table_name");

-- CreateIndex
CREATE INDEX "audit_log_timestamp_idx" ON "audit_log"("timestamp");

-- CreateIndex
CREATE INDEX "audit_log_user_id_idx" ON "audit_log"("user_id");

-- CreateIndex
CREATE INDEX "audit_log_operation_idx" ON "audit_log"("operation");

-- AddForeignKey
ALTER TABLE "funnels" ADD CONSTRAINT "funnels_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nodes" ADD CONSTRAINT "nodes_funnel_id_fkey" FOREIGN KEY ("funnel_id") REFERENCES "funnels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "edges" ADD CONSTRAINT "edges_funnel_id_fkey" FOREIGN KEY ("funnel_id") REFERENCES "funnels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "edges" ADD CONSTRAINT "edges_source_node_id_fkey" FOREIGN KEY ("source_node_id") REFERENCES "nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "edges" ADD CONSTRAINT "edges_target_node_id_fkey" FOREIGN KEY ("target_node_id") REFERENCES "nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "node_data" ADD CONSTRAINT "node_data_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_sessions" ADD CONSTRAINT "ai_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_sessions" ADD CONSTRAINT "ai_sessions_funnel_id_fkey" FOREIGN KEY ("funnel_id") REFERENCES "funnels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "ai_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

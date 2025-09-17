-- Migration: Add organization structure with industries table
-- Created: 2025-01-10
-- Description: 
--   1. Create industries table to store industry options
--   2. Create enums for company size and sales model
--   3. Add structured fields to organizations table
--   4. Insert default industry data

-- ===== Step 1: Create new enum types =====

-- Create company size enum
CREATE TYPE "company_size" AS ENUM (
  'SIZE_1_10',
  'SIZE_11_30', 
  'SIZE_31_100'
);

-- Create sales model enum
CREATE TYPE "sales_model" AS ENUM (
  'TO_B',
  'TO_C'
);

-- ===== Step 2: Create industries table =====

CREATE TABLE IF NOT EXISTS "industries" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "code" VARCHAR(50) UNIQUE NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "name_en" VARCHAR(100),
  "description" TEXT,
  "is_active" BOOLEAN DEFAULT true,
  "sort_order" INTEGER DEFAULT 0,
  "created_at" TIMESTAMPTZ(6) DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ(6) DEFAULT NOW()
);

-- Create indexes for industries table
CREATE INDEX IF NOT EXISTS "industries_code_idx" ON "industries"("code");
CREATE INDEX IF NOT EXISTS "industries_is_active_idx" ON "industries"("is_active");
CREATE INDEX IF NOT EXISTS "industries_sort_order_idx" ON "industries"("sort_order");

-- ===== Step 3: Insert default industry data =====

INSERT INTO "industries" ("code", "name", "name_en", "description", "sort_order") VALUES
('technology', '科技/互联网', 'Technology/Internet', '包括软件开发、互联网、IT服务等', 1),
('finance', '金融/保险', 'Finance/Insurance', '包括银行、保险、投资、金融科技等', 2),
('healthcare', '医疗健康', 'Healthcare', '包括医院、制药、医疗设备、健康服务等', 3),
('education', '教育培训', 'Education/Training', '包括学校、培训机构、在线教育等', 4),
('retail', '零售/电商', 'Retail/E-commerce', '包括传统零售、电子商务、快消品等', 5),
('manufacturing', '制造业', 'Manufacturing', '包括传统制造、工业生产、加工业等', 6),
('consulting', '咨询服务', 'Consulting Services', '包括管理咨询、专业服务、商务服务等', 7),
('media', '媒体/广告', 'Media/Advertising', '包括传媒、广告、营销、创意产业等', 8),
('real_estate', '房地产', 'Real Estate', '包括房地产开发、中介、物业管理等', 9),
('travel', '旅游/酒店', 'Travel/Hospitality', '包括旅游、酒店、餐饮、娱乐等', 10),
('other', '其他', 'Other', '其他未分类行业', 99)
ON CONFLICT (code) DO NOTHING;

-- ===== Step 4: Add new columns to organizations table =====

-- Add industry reference
ALTER TABLE "organizations" 
ADD COLUMN IF NOT EXISTS "industry_id" UUID,
ADD COLUMN IF NOT EXISTS "company_size" "company_size",
ADD COLUMN IF NOT EXISTS "location" VARCHAR(100),
ADD COLUMN IF NOT EXISTS "sales_model" "sales_model";

-- Add foreign key constraint
ALTER TABLE "organizations" 
ADD CONSTRAINT "fk_organizations_industry" 
FOREIGN KEY ("industry_id") REFERENCES "industries"("id");

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS "organizations_industry_id_idx" ON "organizations"("industry_id");
CREATE INDEX IF NOT EXISTS "organizations_company_size_idx" ON "organizations"("company_size");
CREATE INDEX IF NOT EXISTS "organizations_sales_model_idx" ON "organizations"("sales_model");

-- ===== Step 5: Update trigger for organizations updated_at =====

-- Create or replace trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for industries table
DROP TRIGGER IF EXISTS update_industries_updated_at ON industries;
CREATE TRIGGER update_industries_updated_at
    BEFORE UPDATE ON industries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Migration completed successfully
-- Next step: Run data migration script to parse existing organization descriptions
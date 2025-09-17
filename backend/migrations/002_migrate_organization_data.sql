-- Migration: Migrate existing organization data from description field
-- Created: 2025-01-10
-- Description: Parse and migrate structured data from organizations.description field

-- ===== Step 1: Create temporary function to parse organization metadata =====

CREATE OR REPLACE FUNCTION parse_organization_metadata()
RETURNS VOID AS $$
DECLARE
    org_record RECORD;
    metadata_start INTEGER;
    metadata_lines TEXT[];
    line_text TEXT;
    industry_code TEXT;
    company_size_enum "company_size";
    sales_model_enum "sales_model";
    location_text TEXT;
    clean_description TEXT;
    industry_id_value UUID;
BEGIN
    -- Loop through organizations with structured metadata in description
    FOR org_record IN 
        SELECT id, description, name 
        FROM organizations 
        WHERE description IS NOT NULL 
        AND description LIKE '%--- 组织信息 ---%'
    LOOP
        RAISE NOTICE 'Processing organization: %', org_record.name;
        
        -- Find metadata section start
        metadata_start := POSITION('--- 组织信息 ---' IN org_record.description);
        
        IF metadata_start > 0 THEN
            -- Extract clean description (content before metadata)
            clean_description := TRIM(SUBSTRING(org_record.description FROM 1 FOR metadata_start - 1));
            IF clean_description = '' THEN
                clean_description := NULL;
            END IF;
            
            -- Split metadata lines
            metadata_lines := string_to_array(
                SUBSTRING(org_record.description FROM metadata_start + LENGTH('--- 组织信息 ---')), 
                E'\n'
            );
            
            -- Initialize variables
            industry_code := NULL;
            company_size_enum := NULL;
            sales_model_enum := NULL;
            location_text := NULL;
            industry_id_value := NULL;
            
            -- Parse each metadata line
            FOREACH line_text IN ARRAY metadata_lines
            LOOP
                line_text := TRIM(line_text);
                
                -- Parse industry
                IF line_text LIKE '行业:%' THEN
                    industry_code := TRIM(REPLACE(SUBSTRING(line_text FROM POSITION(':' IN line_text) + 1), '未设置', ''));
                    IF industry_code = '' THEN
                        industry_code := NULL;
                    END IF;
                    
                    -- Map Chinese industry names to codes
                    CASE industry_code
                        WHEN 'finance' THEN industry_code := 'finance';
                        WHEN 'technology' THEN industry_code := 'technology';
                        WHEN 'healthcare' THEN industry_code := 'healthcare';
                        WHEN 'education' THEN industry_code := 'education';
                        WHEN 'retail' THEN industry_code := 'retail';
                        WHEN 'manufacturing' THEN industry_code := 'manufacturing';
                        WHEN 'consulting' THEN industry_code := 'consulting';
                        WHEN 'media' THEN industry_code := 'media';
                        WHEN 'real_estate' THEN industry_code := 'real_estate';
                        WHEN 'travel' THEN industry_code := 'travel';
                        ELSE industry_code := 'other';
                    END CASE;
                    
                    -- Get industry ID
                    SELECT id INTO industry_id_value FROM industries WHERE code = industry_code LIMIT 1;
                
                -- Parse company size
                ELSIF line_text LIKE '规模:%' THEN
                    CASE TRIM(REPLACE(SUBSTRING(line_text FROM POSITION(':' IN line_text) + 1), '未设置', ''))
                        WHEN '1-10' THEN company_size_enum := 'SIZE_1_10';
                        WHEN '11-30' THEN company_size_enum := 'SIZE_11_30';
                        WHEN '31-100' THEN company_size_enum := 'SIZE_31_100';
                        ELSE company_size_enum := NULL;
                    END CASE;
                
                -- Parse location
                ELSIF line_text LIKE '城市:%' THEN
                    location_text := TRIM(REPLACE(SUBSTRING(line_text FROM POSITION(':' IN line_text) + 1), '未设置', ''));
                    IF location_text = '' THEN
                        location_text := NULL;
                    END IF;
                
                -- Parse sales model
                ELSIF line_text LIKE '销售模型:%' THEN
                    CASE TRIM(REPLACE(SUBSTRING(line_text FROM POSITION(':' IN line_text) + 1), '未设置', ''))
                        WHEN 'toB' THEN sales_model_enum := 'TO_B';
                        WHEN 'toC' THEN sales_model_enum := 'TO_C';
                        ELSE sales_model_enum := NULL;
                    END CASE;
                END IF;
            END LOOP;
            
            -- Update organization with parsed data
            UPDATE organizations 
            SET 
                description = clean_description,
                industry_id = industry_id_value,
                company_size = company_size_enum,
                location = location_text,
                sales_model = sales_model_enum,
                updated_at = NOW()
            WHERE id = org_record.id;
            
            RAISE NOTICE 'Updated organization % with industry=%, size=%, location=%, sales_model=%', 
                org_record.name, industry_code, company_size_enum, location_text, sales_model_enum;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Organization metadata migration completed';
END;
$$ LANGUAGE plpgsql;

-- ===== Step 2: Execute the migration function =====

SELECT parse_organization_metadata();

-- ===== Step 3: Clean up temporary function =====

DROP FUNCTION IF EXISTS parse_organization_metadata();

-- ===== Step 4: Verify migration results =====

-- Show migration summary
SELECT 
    'Migration Summary' as info,
    COUNT(*) as total_organizations,
    COUNT(industry_id) as with_industry,
    COUNT(company_size) as with_size,
    COUNT(location) as with_location,
    COUNT(sales_model) as with_sales_model
FROM organizations;

-- Show sample migrated data
SELECT 
    name,
    i.name as industry_name,
    company_size,
    location,
    sales_model,
    CASE 
        WHEN description IS NOT NULL AND LENGTH(description) > 0 
        THEN SUBSTRING(description FROM 1 FOR 50) || '...'
        ELSE '[No description]'
    END as clean_description
FROM organizations o
LEFT JOIN industries i ON o.industry_id = i.id
ORDER BY o.updated_at DESC
LIMIT 5;

-- Migration completed
-- Final comprehensive discount fix for the database
-- Run this in your Supabase SQL Editor

-- 1. Ensure all required columns exist
DO $$ 
BEGIN
    -- Add discount column to products table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'products' 
                   AND column_name = 'discount' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.products 
        ADD COLUMN discount JSONB DEFAULT NULL;
        RAISE NOTICE 'Added discount column to products table';
    ELSE
        RAISE NOTICE 'Discount column already exists in products table';
    END IF;
    
    -- Add original_price column to order_items table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'order_items' 
                   AND column_name = 'original_price' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.order_items 
        ADD COLUMN original_price DECIMAL(10,2) DEFAULT NULL;
        RAISE NOTICE 'Added original_price column to order_items table';
    ELSE
        RAISE NOTICE 'Original_price column already exists in order_items table';
    END IF;
    
    -- Add discount_applied column to order_items table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'order_items' 
                   AND column_name = 'discount_applied' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.order_items 
        ADD COLUMN discount_applied JSONB DEFAULT NULL;
        RAISE NOTICE 'Added discount_applied column to order_items table';
    ELSE
        RAISE NOTICE 'Discount_applied column already exists in order_items table';
    END IF;
END $$;

-- 2. Add helpful comments
COMMENT ON COLUMN public.products.discount IS 'Product-level discount in JSON format: {"type": "percentage|flat", "value": number}';
COMMENT ON COLUMN public.order_items.original_price IS 'Original price before any discounts were applied';
COMMENT ON COLUMN public.order_items.discount_applied IS 'Discount that was applied to this item in JSON format';

-- 3. Create indexes for better performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_products_discount ON public.products USING GIN(discount);
CREATE INDEX IF NOT EXISTS idx_order_items_discount ON public.order_items USING GIN(discount_applied);

-- 4. Update existing products with sample discounts (optional - for testing)
-- You can uncomment this section if you want to add sample discounts to existing products

/*
UPDATE public.products 
SET discount = '{"type": "percentage", "value": 10}'::jsonb 
WHERE name LIKE '%PVC Pipe%' AND discount IS NULL;

UPDATE public.products 
SET discount = '{"type": "flat", "value": 50}'::jsonb 
WHERE name LIKE '%Window%' AND discount IS NULL;

UPDATE public.products 
SET discount = '{"type": "percentage", "value": 15}'::jsonb 
WHERE name LIKE '%Tool%' AND discount IS NULL;
*/

-- 5. Verify the schema
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('order_items', 'products') 
  AND column_name IN ('discount_applied', 'original_price', 'discount')
  AND table_schema = 'public'
ORDER BY table_name, column_name;

-- 6. Show sample discount data format
SELECT 
    'Sample discount formats:' as info,
    '{"type": "percentage", "value": 10}' as percentage_discount,
    '{"type": "flat", "value": 100}' as flat_discount;

COMMIT;
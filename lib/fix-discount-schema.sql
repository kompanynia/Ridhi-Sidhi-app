-- Fix discount schema for order_items table
-- Run this in your Supabase SQL Editor

-- Check if the columns exist and add them if they don't
DO $$ 
BEGIN
    -- Add original_price column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'order_items' 
                   AND column_name = 'original_price' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.order_items 
        ADD COLUMN original_price DECIMAL(10,2) DEFAULT NULL;
    END IF;
    
    -- Add discount_applied column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'order_items' 
                   AND column_name = 'discount_applied' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.order_items 
        ADD COLUMN discount_applied JSONB DEFAULT NULL;
    END IF;
    
    -- Add discount column to products table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'products' 
                   AND column_name = 'discount' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.products 
        ADD COLUMN discount JSONB DEFAULT NULL;
    END IF;
END $$;

-- Add helpful comments
COMMENT ON COLUMN public.order_items.original_price IS 'Original price before any discounts were applied';
COMMENT ON COLUMN public.order_items.discount_applied IS 'Discount that was applied to this item in JSON format';
COMMENT ON COLUMN public.products.discount IS 'Product-level discount in JSON format: {"type": "percentage|flat", "value": number}';

-- Create indexes for better performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_order_items_discount ON public.order_items USING GIN(discount_applied);
CREATE INDEX IF NOT EXISTS idx_products_discount ON public.products USING GIN(discount);

-- Verify the schema
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('order_items', 'products') 
  AND column_name IN ('discount_applied', 'original_price', 'discount')
  AND table_schema = 'public'
ORDER BY table_name, column_name;
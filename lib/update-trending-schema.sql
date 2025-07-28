-- Update database schema to support trending products
-- Run this in your Supabase SQL Editor

-- 1. Add trending columns to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS is_trending BOOLEAN DEFAULT FALSE;

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS trending_order INTEGER DEFAULT NULL;

-- 2. Create index for better performance on trending queries
CREATE INDEX IF NOT EXISTS idx_products_trending ON public.products(is_trending, trending_order);

-- 3. Add comments for documentation
COMMENT ON COLUMN public.products.is_trending IS 'Whether this product is marked as trending by admin';
COMMENT ON COLUMN public.products.trending_order IS 'Custom order for trending products (lower number = higher priority)';

-- 4. Create a function to get trending products (optional - for easier querying)
CREATE OR REPLACE FUNCTION get_trending_products(location_filter TEXT DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  price DECIMAL(10,2),
  image_url TEXT,
  company TEXT,
  category TEXT,
  variations JSONB,
  locations TEXT[],
  discount JSONB,
  is_trending BOOLEAN,
  trending_order INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.description,
    p.price,
    p.image_url,
    p.company,
    p.category,
    p.variations,
    p.locations,
    p.discount,
    p.is_trending,
    p.trending_order
  FROM public.products p
  WHERE p.is_trending = TRUE
    AND (location_filter IS NULL OR location_filter = ANY(p.locations))
  ORDER BY p.trending_order ASC NULLS LAST, p.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 5. Grant permissions for the function
GRANT EXECUTE ON FUNCTION get_trending_products TO anon, authenticated;

COMMIT;
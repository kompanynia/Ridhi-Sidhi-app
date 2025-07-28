-- Add trending products functionality to the database
-- Run this in your Supabase SQL Editor

-- 1. Add trending column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS is_trending BOOLEAN DEFAULT FALSE;

-- 2. Add trending_order column for custom ordering of trending products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS trending_order INTEGER DEFAULT NULL;

-- 3. Create index for better performance on trending queries
CREATE INDEX IF NOT EXISTS idx_products_trending ON public.products(is_trending, trending_order);

-- 4. Add comment for documentation
COMMENT ON COLUMN public.products.is_trending IS 'Whether this product is marked as trending by admin';
COMMENT ON COLUMN public.products.trending_order IS 'Custom order for trending products (lower number = higher priority)';

-- 5. Update some sample products to be trending (optional - for testing)
UPDATE public.products 
SET is_trending = TRUE, trending_order = 1 
WHERE name = 'PVC Pipe - Standard';

UPDATE public.products 
SET is_trending = TRUE, trending_order = 2 
WHERE name = 'UPVC Window Frame';

UPDATE public.products 
SET is_trending = TRUE, trending_order = 3 
WHERE name = 'PVC Water Tank';

-- 6. Create a function to get trending products (optional - for easier querying)
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
    p.trending_order
  FROM public.products p
  WHERE p.is_trending = TRUE
    AND (location_filter IS NULL OR location_filter = ANY(p.locations))
  ORDER BY p.trending_order ASC NULLS LAST, p.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 7. Grant permissions for the function
GRANT EXECUTE ON FUNCTION get_trending_products TO anon, authenticated;

COMMIT;
-- Update location references from Pratapgarh to Mungana

-- Update users table
UPDATE users 
SET location = 'Mungana' 
WHERE location = 'Pratapgarh';

-- Update orders table
UPDATE orders 
SET location = 'Mungana' 
WHERE location = 'Pratapgarh';

-- Update products table locations array
UPDATE products 
SET locations = array_replace(locations, 'Pratapgarh', 'Mungana')
WHERE 'Pratapgarh' = ANY(locations);

-- Update product variations in the variations JSON column
UPDATE products 
SET variations = (
  SELECT jsonb_agg(
    CASE 
      WHEN variation->>'availableLocations' IS NOT NULL THEN
        jsonb_set(
          variation,
          '{availableLocations}',
          (
            SELECT jsonb_agg(
              CASE 
                WHEN location_item::text = '"Pratapgarh"' THEN '"Mungana"'::jsonb
                ELSE location_item
              END
            )
            FROM jsonb_array_elements(variation->'availableLocations') AS location_item
          )
        )
      ELSE variation
    END
  )
  FROM jsonb_array_elements(variations) AS variation
)
WHERE variations::text LIKE '%Pratapgarh%';

-- Update database constraints to use Mungana instead of Pratapgarh
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_location_check;
ALTER TABLE users ADD CONSTRAINT users_location_check 
  CHECK (location IN ('Udaipur', 'Mungana'));

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_location_check;
ALTER TABLE orders ADD CONSTRAINT orders_location_check 
  CHECK (location IN ('Udaipur', 'Mungana'));

-- Update any enum types if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'location_enum') THEN
    ALTER TYPE location_enum RENAME VALUE 'Pratapgarh' TO 'Mungana';
  END IF;
END $$;
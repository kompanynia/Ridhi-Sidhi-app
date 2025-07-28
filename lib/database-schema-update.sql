-- Database schema updates for enhanced product system
-- Run this in your Supabase SQL Editor

-- 1. Add discount column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS discount JSONB DEFAULT NULL;

-- 2. Add discount tracking columns to order_items table
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS original_price DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS discount_applied JSONB DEFAULT NULL;

-- 3. Update products table sample data to match new structure
-- First, clear existing sample data
DELETE FROM public.products;

-- Insert new sample products with enhanced variation structure
INSERT INTO public.products (name, description, price, image_url, company, category, variations, locations, discount) VALUES

-- PVC Pipe with Size × Variety combinations
('PVC Pipe - Standard', 
 'High-quality PVC pipe for plumbing and drainage applications. Durable and long-lasting.', 
 250.00, 
 'https://images.unsplash.com/photo-1617806118233-18e1de247200?q=80&w=1000', 
 'Ajay Pipes', 
 'Pipes', 
 '[
   {
     "id": "small-standard",
     "size": "Small",
     "variety": "Standard",
     "price": 200,
     "description": "Basic small pipe for residential use",
     "availableLocations": ["Udaipur", "Pratapgarh"]
   },
   {
     "id": "small-premium",
     "size": "Small", 
     "variety": "Premium",
     "price": 250,
     "description": "High-grade small pipe with enhanced durability",
     "availableLocations": ["Udaipur"],
     "discount": {"type": "percentage", "value": 10}
   },
   {
     "id": "medium-standard",
     "size": "Medium",
     "variety": "Standard", 
     "price": 300,
     "description": "Medium pipe for commercial applications",
     "availableLocations": ["Udaipur", "Pratapgarh"]
   },
   {
     "id": "medium-premium",
     "size": "Medium",
     "variety": "Premium",
     "price": 400,
     "description": "Premium medium pipe with superior quality",
     "availableLocations": ["Pratapgarh"]
   },
   {
     "id": "large-standard",
     "size": "Large",
     "variety": "Standard",
     "price": 450,
     "description": "Large pipe for industrial use",
     "availableLocations": ["Udaipur"]
   }
 ]'::jsonb,
 '{"Udaipur", "Pratapgarh"}',
 '{"type": "flat", "value": 25}'::jsonb),

-- CPVC Pipe with discounts
('CPVC Pipe - Hot Water', 
 'Chlorinated PVC pipes designed specifically for hot water applications. Temperature resistant.', 
 350.00, 
 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?q=80&w=1000', 
 'Ajay Pipes', 
 'Pipes', 
 '[
   {
     "id": "small-gold",
     "size": "Small",
     "variety": "Gold",
     "price": 320,
     "description": "Gold-grade small CPVC pipe",
     "availableLocations": ["Udaipur"]
   },
   {
     "id": "small-silver",
     "size": "Small",
     "variety": "Silver", 
     "price": 280,
     "description": "Silver-grade small CPVC pipe",
     "availableLocations": ["Udaipur", "Pratapgarh"],
     "discount": {"type": "percentage", "value": 15}
   },
   {
     "id": "medium-gold",
     "size": "Medium",
     "variety": "Gold",
     "price": 420,
     "description": "Gold-grade medium CPVC pipe",
     "availableLocations": ["Udaipur"]
   },
   {
     "id": "large-silver",
     "size": "Large", 
     "variety": "Silver",
     "price": 500,
     "description": "Silver-grade large CPVC pipe",
     "availableLocations": ["Pratapgarh"]
   }
 ]'::jsonb,
 '{"Udaipur", "Pratapgarh"}',
 NULL),

-- PVC Fittings
('PVC Elbow Joint', 
 'PVC elbow joint for connecting pipes at 90-degree angles. Easy to install.', 
 45.00, 
 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=1000', 
 'Ajay Pipes', 
 'Fittings', 
 '[
   {
     "id": "small-standard",
     "size": "Small",
     "variety": "Standard",
     "price": 35,
     "description": "Standard small elbow joint",
     "availableLocations": ["Udaipur", "Pratapgarh"]
   },
   {
     "id": "medium-standard", 
     "size": "Medium",
     "variety": "Standard",
     "price": 45,
     "description": "Standard medium elbow joint",
     "availableLocations": ["Udaipur", "Pratapgarh"]
   },
   {
     "id": "large-heavy-duty",
     "size": "Large",
     "variety": "Heavy Duty",
     "price": 65,
     "description": "Heavy-duty large elbow joint for industrial use",
     "availableLocations": ["Udaipur"],
     "discount": {"type": "flat", "value": 10}
   }
 ]'::jsonb,
 '{"Udaipur", "Pratapgarh"}',
 NULL),

-- UPVC Windows
('UPVC Window Frame', 
 'Unplasticized PVC window frame. Weather-resistant and low maintenance.', 
 1200.00, 
 'https://images.unsplash.com/photo-1604082787741-d1f78ce8e4a0?q=80&w=1000', 
 'XYZ Co.', 
 'Windows', 
 '[
   {
     "id": "small-standard",
     "size": "Small",
     "variety": "Standard",
     "price": 1000,
     "description": "Small standard window frame (3x2 ft)",
     "availableLocations": ["Udaipur"]
   },
   {
     "id": "small-premium",
     "size": "Small",
     "variety": "Premium",
     "price": 1300,
     "description": "Small premium window frame with enhanced features",
     "availableLocations": ["Udaipur"]
   },
   {
     "id": "medium-standard",
     "size": "Medium", 
     "variety": "Standard",
     "price": 1400,
     "description": "Medium standard window frame (4x3 ft)",
     "availableLocations": ["Udaipur", "Pratapgarh"]
   },
   {
     "id": "large-premium",
     "size": "Large",
     "variety": "Premium",
     "price": 2000,
     "description": "Large premium window frame (5x4 ft)",
     "availableLocations": ["Udaipur"],
     "discount": {"type": "percentage", "value": 12}
   }
 ]'::jsonb,
 '{"Udaipur", "Pratapgarh"}',
 '{"type": "percentage", "value": 8}'::jsonb),

-- Water Storage Tank
('PVC Water Tank', 
 'Food-grade PVC water storage tank. UV-resistant and durable.', 
 3500.00, 
 'https://images.unsplash.com/photo-1571907483083-af70aeda3086?q=80&w=1000', 
 'ABC Plastics', 
 'Storage', 
 '[
   {
     "id": "small-standard",
     "size": "Small",
     "variety": "Standard",
     "price": 2800,
     "description": "500L standard water tank",
     "availableLocations": ["Pratapgarh"]
   },
   {
     "id": "medium-standard",
     "size": "Medium",
     "variety": "Standard", 
     "price": 4200,
     "description": "1000L standard water tank",
     "availableLocations": ["Udaipur", "Pratapgarh"]
   },
   {
     "id": "large-premium",
     "size": "Large",
     "variety": "Premium",
     "price": 6800,
     "description": "2000L premium water tank with UV protection",
     "availableLocations": ["Udaipur"],
     "discount": {"type": "flat", "value": 500}
   }
 ]'::jsonb,
 '{"Udaipur", "Pratapgarh"}',
 NULL),

-- Tools
('PVC Pipe Cutter', 
 'Professional-grade PVC pipe cutter. Makes clean cuts with minimal effort.', 
 450.00, 
 'https://images.unsplash.com/photo-1504148455328-c376907d081c?q=80&w=1000', 
 'Tool Masters', 
 'Tools', 
 '[
   {
     "id": "standard-basic",
     "size": "Standard",
     "variety": "Basic",
     "price": 380,
     "description": "Basic pipe cutter for home use",
     "availableLocations": ["Udaipur", "Pratapgarh"]
   },
   {
     "id": "standard-professional",
     "size": "Standard",
     "variety": "Professional",
     "price": 650,
     "description": "Professional-grade pipe cutter with enhanced durability",
     "availableLocations": ["Udaipur", "Pratapgarh"],
     "discount": {"type": "percentage", "value": 20}
   }
 ]'::jsonb,
 '{"Udaipur", "Pratapgarh"}',
 NULL);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_company ON public.products(company);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_locations ON public.products USING GIN(locations);
CREATE INDEX IF NOT EXISTS idx_products_discount ON public.products USING GIN(discount);

-- 5. Update RLS policies to include new discount fields
-- No changes needed as existing policies cover all columns

-- 6. Add helpful comments
COMMENT ON COLUMN public.products.discount IS 'Product-level discount in JSON format: {"type": "percentage|flat", "value": number}';
COMMENT ON COLUMN public.products.variations IS 'Array of size×variety combinations with individual pricing and availability';
COMMENT ON COLUMN public.order_items.original_price IS 'Original price before any discounts were applied';
COMMENT ON COLUMN public.order_items.discount_applied IS 'Discount that was applied to this item in JSON format';

-- 7. Refresh the materialized views if any exist
-- (Add here if you have any materialized views)

COMMIT;
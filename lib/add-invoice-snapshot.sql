-- Add invoice snapshot fields to order_items table
-- This will store product details at the time of order creation
-- to ensure invoices remain consistent even if products are updated later

ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS product_snapshot JSONB,
ADD COLUMN IF NOT EXISTS variation_snapshot JSONB;

-- Update the column comments for clarity
COMMENT ON COLUMN public.order_items.product_snapshot IS 'Snapshot of product data at time of order creation';
COMMENT ON COLUMN public.order_items.variation_snapshot IS 'Snapshot of variation data at time of order creation';

-- Create an index for better performance when querying snapshots
CREATE INDEX IF NOT EXISTS idx_order_items_product_snapshot ON public.order_items USING GIN (product_snapshot);
CREATE INDEX IF NOT EXISTS idx_order_items_variation_snapshot ON public.order_items USING GIN (variation_snapshot);
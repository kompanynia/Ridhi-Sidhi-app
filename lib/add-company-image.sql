-- Add company_image_url column to products table
ALTER TABLE public.products 
ADD COLUMN company_image_url TEXT;

-- Update existing products with sample company images
UPDATE public.products 
SET company_image_url = CASE 
  WHEN company = 'Ajay Pipes' THEN 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?q=80&w=1000'
  WHEN company = 'XYZ Co.' THEN 'https://images.unsplash.com/photo-1604082787741-d1f78ce8e4a0?q=80&w=1000'
  WHEN company = 'ABC Plastics' THEN 'https://images.unsplash.com/photo-1571907483083-af70aeda3086?q=80&w=1000'
  WHEN company = 'Tool Masters' THEN 'https://images.unsplash.com/photo-1504148455328-c376907d081c?q=80&w=1000'
  ELSE 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?q=80&w=1000'
END;
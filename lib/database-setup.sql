-- Complete database setup script for Supabase
-- Run this in your Supabase SQL Editor

-- Enable RLS (Row Level Security)
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.todos CASCADE;

-- Drop existing functions and triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Create todos table (for testing)
CREATE TABLE public.todos (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'customer')) DEFAULT 'customer',
  location TEXT CHECK (location IN ('Udaipur', 'Pratapgarh')),
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table
CREATE TABLE public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT NOT NULL,
  company TEXT NOT NULL,
  category TEXT NOT NULL,
  variations JSONB NOT NULL DEFAULT '[]',
  locations TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  location TEXT NOT NULL CHECK (location IN ('Udaipur', 'Pratapgarh')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_items table
CREATE TABLE public.order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  variation_id TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for todos table (for testing)
CREATE POLICY "Anyone can view todos" ON public.todos
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert todos" ON public.todos
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update todos" ON public.todos
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete todos" ON public.todos
  FOR DELETE USING (true);

-- RLS Policies for users table
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow authenticated users to insert their own profile
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for products table
CREATE POLICY "Anyone can view products" ON public.products
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage products" ON public.products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for orders table
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders" ON public.orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update orders" ON public.orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for order_items table
CREATE POLICY "Users can view own order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE id = order_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create order items for own orders" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE id = order_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    CASE 
      WHEN NEW.email = 'admin123@gmail.com' THEN 'admin'
      ELSE 'customer'
    END
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth process
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample todos for testing
INSERT INTO public.todos (title, completed) VALUES
('Test Supabase Connection', false),
('Set up authentication', false),
('Create product catalog', false);

-- Insert sample products
INSERT INTO public.products (name, description, price, image_url, company, category, variations, locations) VALUES
('PVC Pipe - Standard', 'High-quality PVC pipe for plumbing and drainage applications. Durable and long-lasting.', 250.00, 'https://images.unsplash.com/photo-1617806118233-18e1de247200?q=80&w=1000', 'Ajay Pipes', 'Pipes', '[{"id": "v1", "name": "1/2 inch", "price": 0}, {"id": "v2", "name": "3/4 inch", "price": 50}, {"id": "v3", "name": "1 inch", "price": 100}]', '{"Udaipur", "Pratapgarh"}'),
('CPVC Pipe - Hot Water', 'Chlorinated PVC pipes designed specifically for hot water applications. Temperature resistant.', 350.00, 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?q=80&w=1000', 'Ajay Pipes', 'Pipes', '[{"id": "v1", "name": "1/2 inch", "price": 0}, {"id": "v2", "name": "3/4 inch", "price": 75}, {"id": "v3", "name": "1 inch", "price": 150}]', '{"Udaipur"}'),
('PVC Elbow Joint', 'PVC elbow joint for connecting pipes at 90-degree angles. Easy to install.', 45.00, 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=1000', 'Ajay Pipes', 'Fittings', '[{"id": "v1", "name": "1/2 inch", "price": 0}, {"id": "v2", "name": "3/4 inch", "price": 15}, {"id": "v3", "name": "1 inch", "price": 30}]', '{"Udaipur", "Pratapgarh"}'),
('PVC T-Joint', 'T-shaped PVC joint for creating three-way connections in your plumbing system.', 55.00, 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?q=80&w=1000', 'Ajay Pipes', 'Fittings', '[{"id": "v1", "name": "1/2 inch", "price": 0}, {"id": "v2", "name": "3/4 inch", "price": 20}, {"id": "v3", "name": "1 inch", "price": 35}]', '{"Pratapgarh"}'),
('UPVC Window Frame', 'Unplasticized PVC window frame. Weather-resistant and low maintenance.', 1200.00, 'https://images.unsplash.com/photo-1604082787741-d1f78ce8e4a0?q=80&w=1000', 'XYZ Co.', 'Windows', '[{"id": "v1", "name": "Small (3x2 ft)", "price": 0}, {"id": "v2", "name": "Medium (4x3 ft)", "price": 300}, {"id": "v3", "name": "Large (5x4 ft)", "price": 600}]', '{"Udaipur"}'),
('UPVC Door Frame', 'Durable UPVC door frame with excellent insulation properties. Easy to maintain.', 2500.00, 'https://images.unsplash.com/photo-1534430480872-3498386e7856?q=80&w=1000', 'XYZ Co.', 'Doors', '[{"id": "v1", "name": "Standard (80x32 inch)", "price": 0}, {"id": "v2", "name": "Wide (84x36 inch)", "price": 500}, {"id": "v3", "name": "Double (72x80 inch)", "price": 1000}]', '{"Udaipur", "Pratapgarh"}'),
('PVC Water Tank', 'Food-grade PVC water storage tank. UV-resistant and durable.', 3500.00, 'https://images.unsplash.com/photo-1571907483083-af70aeda3086?q=80&w=1000', 'ABC Plastics', 'Storage', '[{"id": "v1", "name": "500 Liters", "price": 0}, {"id": "v2", "name": "1000 Liters", "price": 1500}, {"id": "v3", "name": "2000 Liters", "price": 3000}]', '{"Pratapgarh"}'),
('PVC Pipe Cutter', 'Professional-grade PVC pipe cutter. Makes clean cuts with minimal effort.', 450.00, 'https://images.unsplash.com/photo-1504148455328-c376907d081c?q=80&w=1000', 'Tool Masters', 'Tools', '[{"id": "v1", "name": "Standard", "price": 0}, {"id": "v2", "name": "Professional", "price": 200}]', '{"Udaipur", "Pratapgarh"}');

-- Create admin user if it doesn't exist
-- First, let's create the admin user in auth.users manually
-- You'll need to run this after creating the admin account through Supabase Auth
-- INSERT INTO public.users (id, email, name, role) 
-- VALUES ('REPLACE_WITH_ADMIN_UUID', 'admin123@gmail.com', 'Admin User', 'admin')
-- ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- Enable realtime for orders table
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.todos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
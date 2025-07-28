-- Fix admin access to user information when viewing orders
-- This allows admins to see customer names in orders and invoices

-- Drop the existing restrictive policy for admin user access
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;

-- Create a comprehensive policy that allows:
-- 1. Users to see their own profile
-- 2. Admins to see all user profiles (needed for orders/invoices)
CREATE POLICY "Users can view profiles and admins can view all" ON public.users
  FOR SELECT USING (
    -- Users can always see their own profile
    auth.uid() = id 
    OR 
    -- Admins can see all user profiles
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Ensure the realtime subscription includes user changes
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;

-- Grant necessary permissions for the join queries
GRANT SELECT ON public.users TO authenticated;
GRANT SELECT ON public.orders TO authenticated;
GRANT SELECT ON public.order_items TO authenticated;
GRANT SELECT ON public.products TO authenticated;
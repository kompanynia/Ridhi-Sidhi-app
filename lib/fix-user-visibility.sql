-- Fix user visibility for admins when viewing orders
-- This ensures admins can see customer names in orders and invoices

-- First, let's check the current policies
-- DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
-- DROP POLICY IF EXISTS "Admins can view all users" ON public.users;

-- Create a single comprehensive policy for user visibility
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can view profiles and admins can view all" ON public.users;

-- Create the new policy
CREATE POLICY "User visibility policy" ON public.users
  FOR SELECT USING (
    -- Users can see their own profile
    auth.uid() = id 
    OR 
    -- Admins can see all profiles
    EXISTS (
      SELECT 1 FROM public.users admin_user
      WHERE admin_user.id = auth.uid() AND admin_user.role = 'admin'
    )
  );

-- Ensure proper grants
GRANT SELECT ON public.users TO authenticated;
GRANT SELECT ON public.orders TO authenticated;
GRANT SELECT ON public.order_items TO authenticated;
GRANT SELECT ON public.products TO authenticated;

-- Add users table to realtime if not already added
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
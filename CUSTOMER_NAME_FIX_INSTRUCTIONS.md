# Fix for Customer Names Not Showing in Admin Orders and Invoices

## Problem
Customer names are not visible in the admin orders screen and invoices because of Row Level Security (RLS) policies preventing admins from accessing user information when joining tables.

## Solution

### Step 1: Run SQL Fix in Supabase
Go to your Supabase dashboard → SQL Editor and run the following SQL:

```sql
-- Fix user visibility for admins when viewing orders
-- This ensures admins can see customer names in orders and invoices

-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can view profiles and admins can view all" ON public.users;

-- Create the new comprehensive policy
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
```

### Step 2: Code Changes Made
I've already made the following code changes:

1. **Fixed React key error** in admin orders screen
2. **Added debugging** to see what user data is being fetched
3. **Added fallback logic** in case the join query fails due to RLS
4. **Improved query** with explicit foreign key reference

### Step 3: Test the Fix
1. Run the SQL script above in Supabase
2. Refresh your app
3. Check the admin orders screen - customer names should now appear
4. Open an invoice - customer name should be visible there too
5. Check the browser console for debug logs to confirm user data is being fetched

### What the Fix Does
- Allows admins to see all user profiles (needed for customer names in orders)
- Maintains security by still allowing users to only see their own profiles
- Provides fallback logic if RLS policies are still restrictive
- Fixes the React key duplication error

### If It Still Doesn't Work
If customer names still don't appear after running the SQL:
1. Check the browser console for debug logs
2. Verify that your admin user actually has `role = 'admin'` in the database
3. Try logging out and logging back in as admin
4. Check if there are any other RLS policies conflicting

The debug logs will show exactly what user data is being fetched for each order, which will help identify if the issue is with the query or the data itself.
-- Add password field to users table for admin access
-- Run this in your Supabase SQL Editor

-- 1. Add password column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS password TEXT DEFAULT NULL;

-- 2. Add comment to explain the purpose
COMMENT ON COLUMN public.users.password IS 'Plain text password stored for admin access to user accounts';

-- 3. Create index for password lookups (optional, for performance)
CREATE INDEX IF NOT EXISTS idx_users_password ON public.users(password);

-- 4. Update existing users with default passwords (you can customize these)
-- This sets a default password for all existing users
UPDATE public.users 
SET password = 'defaultpass123' 
WHERE password IS NULL;

-- 5. For new users, you can set specific passwords
-- Example: Set admin password
UPDATE public.users 
SET password = 'admin123' 
WHERE role = 'admin' AND email LIKE '%admin%';

COMMIT;
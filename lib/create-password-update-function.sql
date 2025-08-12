-- Create a function to update user password
-- Run this in your Supabase SQL Editor

-- Create the function to update user password
CREATE OR REPLACE FUNCTION public.update_user_password(user_id UUID, new_password TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Update the password field in the users table
  UPDATE public.users 
  SET 
    password = new_password,
    updated_at = NOW()
  WHERE id = user_id;
  
  -- Check if the update was successful
  IF FOUND THEN
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error and return false
    RAISE LOG 'Error in update_user_password: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_user_password(UUID, TEXT) TO authenticated;

-- Also create a simpler direct update function
CREATE OR REPLACE FUNCTION public.save_user_password(user_id UUID, user_password TEXT)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- Update the password
  UPDATE public.users 
  SET password = user_password, updated_at = NOW()
  WHERE id = user_id;
  
  -- Return the updated row
  SELECT row_to_json(u.*) INTO result
  FROM public.users u
  WHERE u.id = user_id;
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.save_user_password(UUID, TEXT) TO authenticated;

COMMIT;
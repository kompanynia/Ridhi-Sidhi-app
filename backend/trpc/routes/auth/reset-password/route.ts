import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { createClient } from '@supabase/supabase-js';

// Create a Supabase admin client for password updates
const supabaseAdmin = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!, // Fallback to anon key if service role not available
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export const resetPasswordProcedure = publicProcedure
  .input(z.object({
    email: z.string().email(),
    newPassword: z.string().min(6)
  }))
  .mutation(async ({ input }: { input: { email: string; newPassword: string } }) => {
    const { email, newPassword } = input;
    
    try {
      // First, check if user exists in our users table
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', email.trim().toLowerCase())
        .single();
      
      if (userError || !userData) {
        throw new Error('User not found');
      }

      // Try to use admin API if service role key is available
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        // Get the auth user by email
        const { data: authUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        
        if (listError) {
          throw new Error('Failed to find user');
        }

        const authUser = authUsers.users.find(user => user.email === email.trim().toLowerCase());
        
        if (!authUser) {
          throw new Error('Auth user not found');
        }

        // Update the user's password using admin API
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          authUser.id,
          { password: newPassword }
        );

        if (updateError) {
          throw new Error(`Failed to update password: ${updateError.message}`);
        }
      } else {
        // Fallback: Use a database function to update password
        // This requires creating a database function in Supabase
        const { error: rpcError } = await supabaseAdmin.rpc('update_user_password', {
          user_email: email.trim().toLowerCase(),
          new_password: newPassword
        });

        if (rpcError) {
          throw new Error(`Password reset not available. Please contact support. Error: ${rpcError.message}`);
        }
      }

      return { success: true, message: 'Password updated successfully' };
    } catch (error: any) {
      console.error('Password reset error:', error);
      throw new Error(error.message || 'Failed to reset password');
    }
  });
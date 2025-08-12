import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { User, UserRole, Location } from '@/types';
import { AuthError, User as SupabaseUser } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setLocation: (location: Location) => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (newPassword: string) => Promise<void>;
  initialize: () => Promise<void>;
  clearError: () => void;
  createUserProfile: (authUser: SupabaseUser, role?: UserRole, password?: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  
  clearError: () => set({ error: null }),
  
  initialize: async () => {
    try {
      console.log('Initializing auth state...');
      set({ isLoading: true, error: null });
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        set({ isLoading: false, isAuthenticated: false, user: null });
        return;
      }
      
      if (!session?.user) {
        console.log('No active session found');
        set({ isLoading: false, isAuthenticated: false, user: null });
        return;
      }
      
      console.log('Found existing session for user:', session.user.email);
      
      // Fetch user profile from our users table
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (profile && !profileError) {
        console.log('User profile loaded:', profile.email, profile.role);
        set({
          user: {
            id: profile.id,
            email: profile.email,
            name: profile.name,
            role: profile.role as UserRole,
            location: profile.location as Location,
            phone: profile.phone || '',
            address: profile.address || '',
          },
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } else {
        console.log('No user profile found, signing out');
        await supabase.auth.signOut();
        set({ isLoading: false, error: null, isAuthenticated: false, user: null });
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      await supabase.auth.signOut();
      set({ isLoading: false, error: null, isAuthenticated: false, user: null });
    }
  },
  
  createUserProfile: async (authUser: SupabaseUser, role: UserRole = 'customer', password?: string) => {
    try {
      console.log('Creating user profile for:', authUser.email);
      
      const { data: newProfile, error: insertError } = await supabase
        .from('users')
        .insert({
          id: authUser.id,
          email: authUser.email || '',
          name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
          role: role,
          password: password || null,
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('Error creating profile:', insertError);
        throw new Error(`Failed to create user profile: ${insertError.message}`);
      }
      
      if (newProfile) {
        console.log('Profile created successfully:', newProfile.email, newProfile.role);
        set({
          user: {
            id: newProfile.id,
            email: newProfile.email,
            name: newProfile.name,
            role: newProfile.role as UserRole,
            location: newProfile.location as Location,
            phone: newProfile.phone || '',
            address: newProfile.address || '',
          },
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      }
    } catch (error) {
      console.error('Error in createUserProfile:', error);
      throw error;
    }
  },
  
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      console.log('Attempting login for:', email);
      
      const cleanEmail = email.trim().toLowerCase();
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      
      if (error) {
        console.error('Login error:', error);
        throw error;
      }
      
      if (data.user) {
        console.log('Login successful for:', data.user.email);
        
        // Fetch user profile
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();
        
        if (profileError) {
          console.error('Profile fetch error:', profileError);
          throw new Error(`Failed to fetch user profile: ${profileError.message}`);
        }
        
        if (profile) {
          console.log('Profile loaded successfully:', profile.role);
          
          set({
            user: {
              id: profile.id,
              email: profile.email,
              name: profile.name,
              role: profile.role as UserRole,
              location: profile.location as Location,
              phone: profile.phone || '',
              address: profile.address || '',
            },
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        }
      }
    } catch (error) {
      const authError = error as AuthError;
      console.error('Login failed:', authError.message);
      set({ 
        error: authError.message || 'An error occurred during login', 
        isLoading: false,
        isAuthenticated: false,
        user: null
      });
      throw error;
    }
  },
  
  signup: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      console.log('Attempting signup for:', email);
      
      const cleanEmail = email.trim().toLowerCase();
      
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            name: name.trim(),
          },
        },
      });
      
      if (error) {
        console.error('Signup error:', error);
        throw error;
      }
      
      if (data.user) {
        console.log('Signup successful for:', data.user.email);
        
        // Wait a moment for the trigger to potentially create the profile
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if profile was created by trigger
        let { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();
        
        // If profile doesn't exist, create it manually (always as customer)
        if (profileError && profileError.code === 'PGRST116') {
          console.log('Profile not found after signup, creating manually...');
          await get().createUserProfile(data.user, 'customer', password);
          return;
        } else if (profileError) {
          console.error('Profile fetch error after signup:', profileError);
          throw new Error(`Failed to fetch user profile: ${profileError.message}`);
        } else if (profile) {
          // Always update the password field, regardless of whether it exists or not
          console.log('Profile exists, ensuring password is saved...');
          const { error: updateError } = await supabase
            .from('users')
            .update({ password: password })
            .eq('id', data.user.id);
          
          if (updateError) {
            console.error('Error updating password in profile:', updateError);
            throw new Error(`Failed to save password: ${updateError.message}`);
          } else {
            console.log('Password saved to profile successfully');
            profile.password = password;
          }
        }
        
        if (profile) {
          console.log('Signup profile loaded successfully:', profile.role);
          
          set({
            user: {
              id: profile.id,
              email: profile.email,
              name: profile.name,
              role: profile.role as UserRole,
              location: profile.location as Location,
              phone: profile.phone || '',
              address: profile.address || '',
            },
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        }
      }
    } catch (error) {
      const authError = error as AuthError;
      console.error('Signup failed:', authError.message);
      set({ 
        error: authError.message || 'An error occurred during signup', 
        isLoading: false,
        isAuthenticated: false,
        user: null
      });
      throw error;
    }
  },
  
  logout: async () => {
    console.log('Starting logout process...');
    set({ isLoading: true });
    
    try {
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Supabase signout error:', error);
      }
    } catch (error) {
      console.error('Error during supabase signout:', error);
    }
    
    // Always clear local state regardless of supabase signout result
    set({
      user: null,
      isAuthenticated: false,
      error: null,
      isLoading: false,
    });
    
    console.log('Logout completed - state cleared');
  },
  
  setLocation: async (location) => {
    const { user } = get();
    if (!user) return;
    
    try {
      console.log('Setting location to:', location);
      const { error } = await supabase
        .from('users')
        .update({ location })
        .eq('id', user.id);
      
      if (error) throw error;
      
      set(state => ({
        user: state.user ? { ...state.user, location } : null,
      }));
      console.log('Location updated successfully');
    } catch (error) {
      console.error('Error updating location:', error);
      throw error;
    }
  },
  
  updateProfile: async (updates) => {
    const { user } = get();
    if (!user) return;
    
    set({ isLoading: true, error: null });
    try {
      console.log('Updating profile:', updates);
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id);
      
      if (error) throw error;
      
      set(state => ({
        user: state.user ? { ...state.user, ...updates } : null,
        isLoading: false,
      }));
      console.log('Profile updated successfully');
    } catch (error) {
      const authError = error as Error;
      console.error('Profile update failed:', authError.message);
      set({ 
        error: authError.message || 'Failed to update profile', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  changePassword: async (currentPassword, newPassword) => {
    set({ isLoading: true, error: null });
    try {
      console.log('Changing password...');
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      set({ isLoading: false });
      console.log('Password changed successfully');
    } catch (error) {
      const authError = error as AuthError;
      console.error('Password change failed:', authError.message);
      set({ 
        error: authError.message || 'Failed to change password', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  forgotPassword: async (email) => {
    set({ isLoading: true, error: null });
    try {
      console.log('Sending password reset email to:', email);
      
      const cleanEmail = email.trim().toLowerCase();
      
      // Check if user exists in our database first
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', cleanEmail)
        .single();
      
      if (userError || !user) {
        throw new Error('No account found with this email address');
      }
      
      // Send password reset email using Supabase's built-in functionality
      // The redirect URL should be configured in Supabase Dashboard > Authentication > URL Configuration
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);
      
      if (error) {
        throw error;
      }
      
      set({ isLoading: false });
      console.log('Password reset email sent successfully');
    } catch (error) {
      const authError = error as Error;
      console.error('Password reset failed:', authError.message);
      set({ 
        error: authError.message || 'Failed to send password reset email', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  resetPassword: async (newPassword) => {
    set({ isLoading: true, error: null });
    try {
      console.log('Updating password...');
      
      // Update the password for the currently authenticated user
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        throw error;
      }
      
      set({ isLoading: false });
      console.log('Password updated successfully');
    } catch (error) {
      const authError = error as Error;
      console.error('Password update failed:', authError.message);
      set({ 
        error: authError.message || 'Failed to update password', 
        isLoading: false 
      });
      throw error;
    }
  },
}));
import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import Constants from 'expo-constants'

// Try to get from process.env first (for development), then from Constants (for production)
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 
                    Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL ||
                    Constants.manifest?.extra?.EXPO_PUBLIC_SUPABASE_URL

const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
                        Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
                        Constants.manifest?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
  console.error('URL:', supabaseUrl)
  console.error('Key:', supabaseAnonKey ? 'Present' : 'Missing')
  
  // Instead of throwing, use dummy values to prevent crash
  // The app might not work fully, but at least it won't crash
}

export const supabase = createClient(
  supabaseUrl || 'https://dummy.supabase.co',
  supabaseAnonKey || 'dummy-key',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      flowType: 'pkce',
    },
  }
)

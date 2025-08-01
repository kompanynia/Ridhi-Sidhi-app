import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/authStore';
import { colors } from '@/constants/colors';

export default function IndexScreen() {
  const router = useRouter();
  const { user, isAuthenticated, initialize, isLoading } = useAuthStore();
  const [hasInitialized, setHasInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('Starting auth initialization...');
        await initialize();
        console.log('Auth initialization completed');
        setInitError(null);
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        setInitError(error instanceof Error ? error.message : 'Failed to initialize');
      } finally {
        setHasInitialized(true);
      }
    };

    initializeAuth();
  }, [initialize]);

  useEffect(() => {
    if (hasInitialized && !isLoading && !initError) {
      console.log('Index screen - Routing decision:', { 
        isAuthenticated, 
        userEmail: user?.email, 
        userRole: user?.role,
        userLocation: user?.location 
      });
      
      // Small delay to ensure all state updates are complete
      const timeoutId = setTimeout(() => {
        try {
          if (isAuthenticated && user) {
            // Check if user has selected location
            if (!user.location) {
              console.log('User authenticated but no location, redirecting to location selection');
              router.replace('/location');
            } else {
              // Route based on user role
              if (user.role === 'admin') {
                console.log('Redirecting admin user to admin dashboard');
                router.replace('/(admin)');
              } else {
                console.log('Redirecting customer user to customer dashboard');
                router.replace('/(customer)');
              }
            }
          } else {
            console.log('User not authenticated, redirecting to login');
            router.replace('/login');
          }
        } catch (error) {
          console.error('Navigation error:', error);
          router.replace('/login');
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [isAuthenticated, user, isLoading, hasInitialized, initError, router]);

  // Show error screen if initialization failed
  if (initError) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ 
          flex: 1, 
          justifyContent: 'center', 
          alignItems: 'center',
          gap: 16,
          padding: 20
        }}>
          <Text style={{ 
            color: colors.error || colors.text, 
            fontSize: 18,
            fontWeight: '600',
            textAlign: 'center'
          }}>
            Initialization Failed
          </Text>
          <Text style={{ 
            color: colors.textSecondary || colors.text, 
            fontSize: 14,
            textAlign: 'center'
          }}>
            {initError}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show loading screen while initializing
  if (!hasInitialized || isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ 
          flex: 1, 
          justifyContent: 'center', 
          alignItems: 'center',
          gap: 16
        }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ 
            color: colors.text, 
            fontSize: 16,
            fontWeight: '500'
          }}>
            Loading...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // This should not be reached as routing should happen in useEffect
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center' 
      }}>
        <Text style={{ color: colors.text }}>Initializing...</Text>
      </View>
    </SafeAreaView>
  );
}
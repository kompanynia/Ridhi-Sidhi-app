import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/stores/authStore';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error, clearError, isAuthenticated, user } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState('');


  // Navigate after successful login
  useEffect(() => {
    console.log('Login screen - Auth state changed:', { isAuthenticated, userEmail: user?.email, userLocation: user?.location });
    
    if (isAuthenticated && user) {
      console.log('Login successful, navigating to appropriate screen');
      
      // Small delay to ensure state is fully updated
      setTimeout(() => {
        if (!user.location) {
          console.log('User has no location, redirecting to location selection');
          router.replace('/location');
        } else if (user.role === 'admin') {
          console.log('Admin user, redirecting to admin dashboard');
          router.replace('/(admin)');
        } else {
          console.log('Customer user, redirecting to customer dashboard');
          router.replace('/(customer)');
        }
      }, 100);
    }
  }, [isAuthenticated, user, router]);

  const handleLogin = async () => {
    // Clear previous errors
    clearError();
    setValidationError('');
    
    // Simple validation
    if (!email || !password) {
      setValidationError('Please fill in all fields');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setValidationError('Please enter a valid email address');
      return;
    }
    
    try {
      console.log('Attempting login with:', email);
      await login(email, password);
      // Navigation will be handled by useEffect above
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Provide helpful error messages
      if (err.message?.includes('Invalid login credentials')) {
        setValidationError('Invalid email or password. Please check your credentials.');
      } else if (err.message?.includes('Email not confirmed')) {
        setValidationError('Please check your email and confirm your account before logging in.');
      } else {
        setValidationError(err.message || 'Login failed. Please try again.');
      }
    }
  };



  const handleSignup = () => {
    router.push('/signup');
  };



  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Login to your account</Text>
          </View>
          

          
          <View style={styles.form}>
            {(error || validationError) && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error || validationError}</Text>
              </View>
            )}
            
            <Input
              label="Email"
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            
            <Input
              label="Password"
              placeholder="Enter your password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            

            
            <Button
              title="Login"
              onPress={handleLogin}
              loading={isLoading}
              fullWidth
              style={styles.loginButton}
            />
          </View>
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don&apos;t have an account?</Text>
            <TouchableOpacity onPress={handleSignup}>
              <Text style={styles.signupText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>


    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textLight,
  },

  form: {
    marginBottom: 24,
  },
  errorContainer: {
    backgroundColor: 'rgba(229, 115, 115, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    lineHeight: 20,
  },

  loginButton: {
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: colors.textLight,
    marginRight: 4,
  },
  signupText: {
    color: colors.primary,
    fontWeight: '600',
  },

});
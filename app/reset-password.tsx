import React, { useState } from 'react';
import { StyleSheet, View, Text, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/stores/authStore';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { forgotPassword, isLoading, error, clearError } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [validationError, setValidationError] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const handleSendResetEmail = async () => {
    clearError();
    setValidationError('');
    
    if (!email) {
      setValidationError('Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setValidationError('Please enter a valid email address');
      return;
    }

    try {
      await forgotPassword(email);
      setEmailSent(true);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setValidationError(err.message || 'Failed to send reset email. Please try again.');
    }
  };

  const handleBackToLogin = () => {
    router.replace('/login');
  };

  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Reset Password',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }} 
      />
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
              <Text style={styles.title}>
                {emailSent ? 'Check Your Email' : 'Reset Password'}
              </Text>
              <Text style={styles.subtitle}>
                {emailSent 
                  ? 'We&apos;ve sent a password reset link to your email address. Please check your inbox and follow the instructions to reset your password.' 
                  : 'Enter your email address and we&apos;ll send you a link to reset your password.'
                }
              </Text>
            </View>
            
            {!emailSent ? (
              <View style={styles.form}>
                {(error || validationError) && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error || validationError}</Text>
                  </View>
                )}
                
                <Input
                  label="Email Address"
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
                
                <Button
                  title="Send Reset Link"
                  onPress={handleSendResetEmail}
                  loading={isLoading}
                  fullWidth
                  style={styles.resetButton}
                />
              </View>
            ) : (
              <View style={styles.successContainer}>
                <View style={styles.successIcon}>
                  <Text style={styles.successIconText}>✓</Text>
                </View>
                <Text style={styles.successText}>
                  Reset link sent to {email}
                </Text>
                <Text style={styles.instructionText}>
                  Didn&apos;t receive the email? Check your spam folder or try again.
                </Text>
                <Button
                  title="Try Again"
                  onPress={() => setEmailSent(false)}
                  variant="outline"
                  style={styles.tryAgainButton}
                />
              </View>
            )}
            
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Remember your password?
              </Text>
              <Button
                title="Back to Login"
                onPress={handleBackToLogin}
                variant="outline"
                style={styles.loginButton}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
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
  backButton: {
    marginLeft: -8,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 22,
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
  resetButton: {
    marginTop: 16,
  },
  successContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  successIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successIconText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  successText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  tryAgainButton: {
    paddingHorizontal: 24,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    color: colors.textLight,
    marginBottom: 8,
  },
  loginButton: {
    paddingHorizontal: 0,
  },
});
import React, { useState } from 'react';
import { StyleSheet, View, Text, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { colors } from '@/constants/colors';
import { supabase } from '@/lib/supabase';

export default function SimpleResetPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'email' | 'password'>('email');

  const handleVerifyEmail = async () => {
    setError('');
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      // Check if user exists in our database
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', email.trim().toLowerCase())
        .single();
      
      if (userError || !user) {
        setError('No account found with this email address');
        return;
      }

      // Move to password reset step
      setStep('password');
    } catch (error: any) {
      console.error('Email verification error:', error);
      setError('Failed to verify email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError('');
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from current password');
      return;
    }

    setIsLoading(true);
    try {
      // First, try to sign in with current credentials to verify
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: currentPassword,
      });

      if (signInError) {
        setError('Current password is incorrect');
        return;
      }

      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        throw updateError;
      }

      // Sign out after password change
      await supabase.auth.signOut();

      Alert.alert(
        'Password Updated',
        'Your password has been successfully updated. Please log in with your new password.',
        [{ text: 'OK', onPress: () => router.replace('/login') }]
      );
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'password') {
      setStep('email');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
    } else {
      router.back();
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Reset Password',
          headerLeft: () => (
            <TouchableOpacity
              onPress={handleBack}
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
                {step === 'email' ? 'Verify Your Email' : 'Reset Your Password'}
              </Text>
              <Text style={styles.subtitle}>
                {step === 'email' 
                  ? 'Enter your email address to continue' 
                  : 'Enter your current password and choose a new one'
                }
              </Text>
            </View>
            
            <View style={styles.form}>
              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}
              
              {step === 'email' ? (
                <>
                  <Input
                    label="Email Address"
                    placeholder="Enter your email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                  
                  <Button
                    title="Continue"
                    onPress={handleVerifyEmail}
                    loading={isLoading}
                    fullWidth
                    style={styles.continueButton}
                  />
                </>
              ) : (
                <>
                  <View style={styles.emailDisplay}>
                    <Text style={styles.emailLabel}>Email:</Text>
                    <Text style={styles.emailText}>{email}</Text>
                  </View>
                  
                  <Input
                    label="Current Password"
                    placeholder="Enter your current password"
                    secureTextEntry
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                  />
                  
                  <Input
                    label="New Password"
                    placeholder="Enter new password (min 6 characters)"
                    secureTextEntry
                    value={newPassword}
                    onChangeText={setNewPassword}
                  />
                  
                  <Input
                    label="Confirm New Password"
                    placeholder="Confirm new password"
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                  
                  <Button
                    title="Update Password"
                    onPress={handleResetPassword}
                    loading={isLoading}
                    fullWidth
                    style={styles.updateButton}
                  />
                </>
              )}
            </View>
            
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Remember your password?
              </Text>
              <Button
                title="Back to Login"
                onPress={() => router.replace('/login')}
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
  emailDisplay: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  emailLabel: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 4,
  },
  emailText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  continueButton: {
    marginTop: 16,
  },
  updateButton: {
    marginTop: 16,
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
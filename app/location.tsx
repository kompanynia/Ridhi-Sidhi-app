import React, { useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { LocationSelector } from '@/components/LocationSelector';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/stores/authStore';
import { Location } from '@/types';

export default function LocationScreen() {
  const router = useRouter();
  const { setLocation, user } = useAuthStore();
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    if (!selectedLocation) {
      setError('Please select a location to continue');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      
      await setLocation(selectedLocation);
      
      // Small delay to ensure state is updated
      setTimeout(() => {
        // Navigate based on user role
        if (user?.role === 'admin') {
          console.log('Location set, redirecting admin to admin dashboard');
          router.replace('/(admin)');
        } else {
          console.log('Location set, redirecting customer to customer dashboard');
          router.replace('/(customer)');
        }
      }, 100);
    } catch (err) {
      console.error('Error setting location:', err);
      setError('Failed to set location. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Choose Your Location</Text>
          <Text style={styles.subtitle}>
            We'll show you products available in your area
          </Text>
        </View>
        
        <LocationSelector
          selectedLocation={selectedLocation}
          onSelectLocation={setSelectedLocation}
        />
        
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}
        
        <Button
          title="Continue"
          onPress={handleContinue}
          loading={isLoading}
          fullWidth
          style={styles.continueButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
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
    lineHeight: 24,
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
    marginTop: 16,
  },
  continueButton: {
    marginTop: 40,
  },
});
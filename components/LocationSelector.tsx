import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { Location } from '@/types';
import { colors } from '@/constants/colors';

interface LocationSelectorProps {
  selectedLocation: Location | null;
  onSelectLocation: (location: Location) => void;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  selectedLocation,
  onSelectLocation,
}) => {
  const locations: Location[] = ['Udaipur', 'Mungana'];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Your Location</Text>
      <Text style={styles.subtitle}>Products will be shown based on your location</Text>
      
      <View style={styles.optionsContainer}>
        {locations.map((location) => (
          <Pressable
            key={location}
            style={[
              styles.option,
              selectedLocation === location && styles.selectedOption,
            ]}
            onPress={() => onSelectLocation(location)}
          >
            <MapPin 
              size={20} 
              color={selectedLocation === location ? colors.white : colors.primary} 
              style={styles.icon}
            />
            <Text 
              style={[
                styles.optionText,
                selectedLocation === location && styles.selectedOptionText,
              ]}
            >
              {location}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textLight,
    marginBottom: 24,
    textAlign: 'center',
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    gap: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    minWidth: 140,
  },
  selectedOption: {
    backgroundColor: colors.primary,
  },
  icon: {
    marginRight: 8,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  selectedOptionText: {
    color: colors.white,
  },
});
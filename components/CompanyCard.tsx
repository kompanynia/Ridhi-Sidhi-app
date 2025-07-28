import React from 'react';
import { StyleSheet, View, Text, Pressable, Image } from 'react-native';
import { colors } from '@/constants/colors';

interface CompanyCardProps {
  company: string;
  imageUrl: string;
  productCount: number;
  onPress: () => void;
}

export const CompanyCard: React.FC<CompanyCardProps> = ({ 
  company, 
  imageUrl, 
  productCount, 
  onPress 
}) => {
  return (
    <Pressable 
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed
      ]}
      onPress={onPress}
    >
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: imageUrl }} 
          style={styles.image}
          resizeMode="cover"
        />
      </View>
      
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>{company}</Text>
        <Text style={styles.productCount}>
          {productCount} product{productCount !== 1 ? 's' : ''}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    margin: 8,
    width: '45%',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 120,
    backgroundColor: colors.border,
  },
  content: {
    padding: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  productCount: {
    fontSize: 14,
    color: colors.textLight,
  },
});
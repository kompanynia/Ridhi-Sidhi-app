import React from 'react';
import { StyleSheet, View, Text, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Product, calculateDiscountedPrice } from '@/types';
import { colors } from '@/constants/colors';
import { trpc, isBackendConfigured } from '@/lib/trpc';
import { useTrendingStore } from '@/stores/trendingStore';

interface ProductCardProps {
  product: Product;
  compact?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, compact = false }) => {
  const router = useRouter();
  const { isTrending } = useTrendingStore();
  
  // Try to use tRPC if backend is configured, with fallback to zustand store
  const trendingQuery = isBackendConfigured() ? trpc.trending.get.useQuery(undefined, {
    refetchOnWindowFocus: false
  }) : { data: null, error: null };
  
  const handlePress = () => {
    router.push(`/product/${product.id}`);
  };

  // Use only product-level discount
  const activeDiscount = product.discount;
  const hasDiscount = activeDiscount && activeDiscount.value > 0;
  const discountedPrice = hasDiscount ? calculateDiscountedPrice(product.price, activeDiscount) : product.price;
  
  // Use tRPC data if available and successful, otherwise fall back to local state
  const isProductTrending = (trendingQuery.data && !trendingQuery.error) 
    ? trendingQuery.data.some((trendingProduct: any) => trendingProduct.id === product.id)
    : isTrending(product.id);

  return (
    <Pressable 
      style={({ pressed }) => [
        compact ? styles.compactContainer : styles.container,
        pressed && styles.pressed
      ]}
      onPress={handlePress}
    >
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: product.imageUrl }} 
          style={compact ? styles.compactImage : styles.image}
          resizeMode="cover"
        />
        {hasDiscount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountBadgeText}>
              {activeDiscount.type === 'percentage' 
                ? `${activeDiscount.value}%` 
                : `₹${activeDiscount.value}`
              }
            </Text>
            <Text style={styles.discountBadgeLabel}>OFF</Text>
          </View>
        )}
        {isProductTrending && (
          <View style={[styles.trendingBadge, hasDiscount && styles.trendingBadgeWithDiscount]}>
            <Ionicons name="trending-up" size={12} color={colors.white} />
          </View>
        )}
      </View>
      
      <View style={compact ? styles.compactContent : styles.content}>
        <Text style={compact ? styles.compactName : styles.name} numberOfLines={1}>{product.name}</Text>
        <Text style={compact ? styles.compactCompany : styles.company} numberOfLines={1}>{product.company}</Text>
        
        <View style={styles.priceContainer}>
          {hasDiscount ? (
            <View style={styles.priceRow}>
              <Text style={compact ? styles.compactOriginalPrice : styles.originalPrice}>₹{Math.round(product.price)}</Text>
              <Text style={compact ? styles.compactDiscountedPrice : styles.discountedPrice}>₹{Math.round(discountedPrice)}</Text>
            </View>
          ) : (
            <Text style={compact ? styles.compactPrice : styles.price}>₹{Math.round(product.price)}</Text>
          )}
        </View>
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
    height: 150,
    backgroundColor: colors.border,
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.discountBadge,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 40,
    alignItems: 'center',
  },
  discountBadgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 12,
  },
  discountBadgeLabel: {
    color: colors.white,
    fontSize: 8,
    fontWeight: '600',
    lineHeight: 10,
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
  company: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 8,
  },
  priceContainer: {
    minHeight: 20,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  priceRow: {
    flexDirection: 'column',
    gap: 2,
  },
  originalPrice: {
    fontSize: 13,
    color: colors.textLight,
    textDecorationLine: 'line-through',
  },
  discountedPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.discountPrice,
  },
  compactContainer: {
    backgroundColor: colors.white,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    width: '100%',
  },
  compactImage: {
    width: '100%',
    height: 100,
    backgroundColor: colors.border,
  },
  compactContent: {
    padding: 8,
  },
  compactName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  compactCompany: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 4,
  },
  compactPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  compactOriginalPrice: {
    fontSize: 11,
    color: colors.textLight,
    textDecorationLine: 'line-through',
  },
  compactDiscountedPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.discountPrice,
  },
  trendingBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  trendingBadgeWithDiscount: {
    top: 40, // Move down when discount badge is present
  },
});
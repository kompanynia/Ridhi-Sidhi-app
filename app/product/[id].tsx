import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Image, ScrollView, ActivityIndicator, Pressable, TextInput, Animated } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { colors } from '@/constants/colors';
import { useProductStore } from '@/stores/productStore';
import { useCartStore } from '@/stores/cartStore';
import { Product, ProductVariation, calculateDiscountedPrice, getDiscountAmount } from '@/types';
import { ShoppingCart } from 'lucide-react-native';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { products, isLoading } = useProductStore();
  const { addToCart, getItemCount } = useCartStore();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedVariety, setSelectedVariety] = useState<string | null>(null);
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showAddedFeedback, setShowAddedFeedback] = useState(false);
  const [cartAnimation] = useState(new Animated.Value(0));
  
  const handleQuantityChange = (newQuantity: number) => {
    setQuantity(Math.max(1, newQuantity));
  };
  const [error, setError] = useState('');

  useEffect(() => {
    if (products.length > 0 && id) {
      const foundProduct = products.find(p => p.id === id);
      if (foundProduct) {
        setProduct(foundProduct);
        
        // Set default selections if available
        if (foundProduct.variations.length > 0) {
          const firstVariation = foundProduct.variations[0];
          setSelectedSize(firstVariation.size);
          setSelectedVariety(firstVariation.variety);
          setSelectedVariation(firstVariation);
        }
      }
    }
  }, [products, id]);

  useEffect(() => {
    // Update selected variation when size or variety changes
    if (product && selectedSize && selectedVariety) {
      const variation = product.variations.find(
        v => v.size === selectedSize && v.variety === selectedVariety
      );
      setSelectedVariation(variation || null);
      setError('');
    }
  }, [product, selectedSize, selectedVariety]);

  const handleSizeSelect = (size: string) => {
    setSelectedSize(size);
    
    // If the current variety is not available for this size, select the first available variety
    if (product) {
      const availableVarieties = product.variations
        .filter(v => v.size === size)
        .map(v => v.variety);
      
      if (selectedVariety && !availableVarieties.includes(selectedVariety)) {
        setSelectedVariety(availableVarieties[0] || null);
      }
    }
  };

  const handleVarietySelect = (variety: string) => {
    setSelectedVariety(variety);
    
    // If the current size is not available for this variety, select the first available size
    if (product) {
      const availableSizes = product.variations
        .filter(v => v.variety === variety)
        .map(v => v.size);
      
      if (selectedSize && !availableSizes.includes(selectedSize)) {
        setSelectedSize(availableSizes[0] || null);
      }
    }
  };

  const handleAddToCart = () => {
    if (!product || !selectedVariation) {
      setError('Please select both size and variety');
      return;
    }
    
    addToCart(product, selectedVariation.id, quantity);
    
    // Show feedback animation
    setShowAddedFeedback(true);
    Animated.sequence([
      Animated.timing(cartAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(cartAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Hide feedback after 2 seconds
    setTimeout(() => {
      setShowAddedFeedback(false);
    }, 2000);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>Product not found</Text>
        <Button title="Go Back" onPress={() => router.back()} style={styles.backButton} />
      </SafeAreaView>
    );
  }

  // Get unique sizes and varieties
  const availableSizes = Array.from(new Set(product.variations.map(v => v.size))).filter(Boolean);
  const availableVarieties = selectedSize 
    ? Array.from(new Set(product.variations.filter(v => v.size === selectedSize).map(v => v.variety))).filter(Boolean)
    : Array.from(new Set(product.variations.map(v => v.variety))).filter(Boolean);

  // Calculate pricing with product-level discount only
  const currentPrice = selectedVariation ? selectedVariation.price : product.price;
  const currentDescription = selectedVariation?.description;
  
  // Use only product-level discount
  const activeDiscount = product.discount;
  const hasDiscount = activeDiscount && activeDiscount.value > 0;
  const discountedPrice = hasDiscount ? calculateDiscountedPrice(currentPrice, activeDiscount) : currentPrice;
  const discountAmount = hasDiscount ? getDiscountAmount(currentPrice, activeDiscount) : 0;
  
  // Get cart count for floating indicator
  const cartCount = getItemCount();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Image 
          source={{ uri: selectedVariation?.imageUrl || product.imageUrl }} 
          style={styles.image}
          resizeMode="cover"
        />
        
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.name}>{product.name}</Text>
            <Text style={styles.company}>{product.company}</Text>
            
            <View style={styles.priceContainer}>
              {hasDiscount ? (
                <View style={styles.discountPriceRow}>
                  <Text style={styles.originalPrice}>₹{Math.round(currentPrice)}</Text>
                  <Text style={styles.discountedPrice}>₹{Math.round(discountedPrice)}</Text>
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>
                      {activeDiscount!.type === 'percentage' 
                        ? `${activeDiscount!.value}% OFF` 
                        : `₹${activeDiscount!.value} OFF`
                      }
                    </Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.price}>₹{Math.round(currentPrice)}</Text>
              )}
              
              {hasDiscount && (
                <Text style={styles.savingsText}>
                  You save ₹{Math.round(discountAmount)}
                </Text>
              )}
            </View>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quantity</Text>
            <View style={styles.quantityContainer}>
              <Pressable 
                style={styles.quantityButton}
                onPress={() => handleQuantityChange(quantity - 1)}
              >
                <Text style={styles.quantityButtonText}>-</Text>
              </Pressable>
              <TextInput
                style={styles.quantityText}
                value={quantity.toString()}
                onChangeText={(text) => {
                  const num = parseInt(text) || 1;
                  handleQuantityChange(num);
                }}
                keyboardType="numeric"
                textAlign="center"
                selectTextOnFocus
              />
              <Pressable 
                style={styles.quantityButton}
                onPress={() => handleQuantityChange(quantity + 1)}
              >
                <Text style={styles.quantityButtonText}>+</Text>
              </Pressable>
            </View>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{product.description}</Text>
            {currentDescription && (
              <Text style={styles.variationDescription}>{currentDescription}</Text>
            )}
          </View>
          
          {availableVarieties.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Variety</Text>
              <View style={styles.tabContainer}>
                {availableVarieties.map((variety, index) => (
                  <Button
                    key={`variety-${variety}-${index}`}
                    title={variety}
                    variant={selectedVariety === variety ? 'primary' : 'outline'}
                    size="small"
                    onPress={() => handleVarietySelect(variety)}
                    style={[
                      styles.tabButton,
                      selectedVariety === variety && styles.selectedTab
                    ]}
                    textStyle={[
                      styles.tabText,
                      selectedVariety === variety && styles.selectedTabText
                    ]}
                  />
                ))}
              </View>
            </View>
          )}
          
          {availableSizes.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Size</Text>
              <View style={styles.tabContainer}>
                {availableSizes.map((size, index) => (
                  <Button
                    key={`size-${size}-${index}`}
                    title={size}
                    variant={selectedSize === size ? 'primary' : 'outline'}
                    size="small"
                    onPress={() => handleSizeSelect(size)}
                    style={[
                      styles.tabButton,
                      selectedSize === size && styles.selectedTab
                    ]}
                    textStyle={[
                      styles.tabText,
                      selectedSize === size && styles.selectedTabText
                    ]}
                  />
                ))}
              </View>
            </View>
          )}
          
          {selectedVariation && selectedVariation.availableLocations && selectedVariation.availableLocations.length > 0 && (
            <View style={styles.availabilitySection}>
              <Text style={styles.sectionTitle}>Available in</Text>
              <View style={styles.locationTags}>
                {selectedVariation.availableLocations.map((location, index) => (
                  <View key={`location-${location}-${index}`} style={styles.locationTag}>
                    <Text style={styles.locationTagText}>{location}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          
          {error ? (
            <Text style={styles.errorMessage}>{error}</Text>
          ) : null}
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <View style={styles.footerPriceSection}>
            {hasDiscount ? (
              <View style={styles.footerPriceColumn}>
                <View style={styles.footerPriceRow}>
                  <Text style={styles.footerOriginalPrice}>₹{Math.round(currentPrice)}</Text>
                  <Text style={styles.footerDiscountedPrice}>₹{Math.round(discountedPrice)}</Text>
                </View>
                <Text style={styles.footerSavingsText}>Save ₹{Math.round(discountAmount)}</Text>
              </View>
            ) : (
              <Text style={styles.footerPrice}>₹{Math.round(currentPrice)}</Text>
            )}
          </View>
          <Button
            title="Add to Cart"
            onPress={handleAddToCart}
            disabled={!selectedVariation}
            style={styles.addToCartButton}
          />
        </View>
      </View>
      
      {/* Floating Cart Indicator */}
      {cartCount > 0 && (
        <Animated.View 
          style={[
            styles.floatingCart,
            {
              transform: [{
                scale: cartAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.2],
                }),
              }],
            },
          ]}
        >
          <Pressable 
            style={styles.floatingCartButton}
            onPress={() => router.push('/(customer)/cart')}
          >
            <ShoppingCart size={20} color={colors.white} />
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          </Pressable>
        </Animated.View>
      )}
      
      {/* Added to Cart Feedback */}
      {showAddedFeedback && (
        <Animated.View 
          style={[
            styles.addedFeedback,
            {
              opacity: cartAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
              }),
              transform: [{
                translateY: cartAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              }],
            },
          ]}
        >
          <Text style={styles.addedFeedbackText}>✓ Added to Cart!</Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  errorText: {
    fontSize: 18,
    color: colors.error,
    marginBottom: 16,
  },
  backButton: {
    marginTop: 16,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  image: {
    width: '100%',
    height: 300,
    backgroundColor: colors.border,
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  name: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 6,
  },
  company: {
    fontSize: 16,
    color: colors.textLight,
    marginBottom: 12,
  },
  priceContainer: {
    marginTop: 4,
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
  },
  discountPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  originalPrice: {
    fontSize: 18,
    color: colors.textLight,
    textDecorationLine: 'line-through',
  },
  discountedPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.discountPrice,
  },
  discountBadge: {
    backgroundColor: colors.discountBadge,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  discountText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  savingsText: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '600',
    marginTop: 4,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  variationDescription: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 20,
    marginTop: 8,
    fontStyle: 'italic',
  },
  tabContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tabButton: {
    minWidth: 80,
    borderRadius: 20,
    borderWidth: 2,
  },
  selectedTab: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectedTabText: {
    color: colors.white,
    fontWeight: '600',
  },
  availabilitySection: {
    marginBottom: 24,
  },
  locationTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  locationTag: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
  },
  locationTagText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '500',
  },
  errorMessage: {
    color: colors.error,
    marginBottom: 16,
    textAlign: 'center',
    fontSize: 14,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    gap: 16,
  },
  footerPriceSection: {
    flex: 1,
  },
  footerPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  footerPriceColumn: {
    flexDirection: 'column',
  },
  footerPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerOriginalPrice: {
    fontSize: 16,
    color: colors.textLight,
    textDecorationLine: 'line-through',
  },
  footerDiscountedPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.discountPrice,
  },
  footerSavingsText: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '600',
    marginTop: 2,
  },
  addToCartButton: {
    flex: 2,
    minWidth: 140,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 8,
    overflow: 'hidden',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.border,
  },
  quantityButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
  },
  quantityButtonText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  quantityText: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: '700',
    minWidth: 50,
    textAlign: 'center',
    backgroundColor: colors.white,
  },
  floatingCart: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 1000,
  },
  floatingCartButton: {
    backgroundColor: colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.error,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  cartBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  addedFeedback: {
    position: 'absolute',
    top: 130,
    right: 20,
    backgroundColor: colors.success,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 1000,
  },
  addedFeedbackText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
});
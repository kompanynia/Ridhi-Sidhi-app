import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Alert, TextInput, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AntDesign } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { CartItemComponent } from '@/components/CartItem';
import { colors } from '@/constants/colors';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { calculateDiscountedPrice, getDiscountAmount } from '@/types';

export default function CartScreen() {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const { user } = useAuthStore();
  const { 
    items, 
    updateQuantity, 
    removeFromCart, 
    getTotalAmount, 
    placeOrder,
    clearCart,
  } = useCartStore();
  
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderMessage, setOrderMessage] = useState('');

  const totalAmount = getTotalAmount();
  
  // Calculate total savings
  const totalSavings = items.reduce((savings, item) => {
    const variation = item.product.variations.find(v => v.id === item.variationId);
    if (!variation) return savings;
    
    // Use only product-level discount
    const activeDiscount = item.product.discount;
    if (!activeDiscount) return savings;
    
    const discountAmount = getDiscountAmount(variation.price, activeDiscount);
    return savings + (discountAmount * item.quantity);
  }, 0);

  const originalTotal = items.reduce((total, item) => {
    const variation = item.product.variations.find(v => v.id === item.variationId);
    return total + (variation ? variation.price * item.quantity : 0);
  }, 0);

  const handlePlaceOrder = async () => {
    if (!user?.location) {
      Alert.alert('Error', 'Location not selected. Please select a location first.');
      return;
    }
    
    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated. Please login again.');
      return;
    }
    
    if (items.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to your cart before placing an order.');
      return;
    }
    
    setIsPlacingOrder(true);
    
    try {
      const order = await placeOrder(user.location, user.id, orderMessage.trim() || undefined);
      Alert.alert(
        'Order Placed Successfully!', 
        `Your order #${order.id} has been placed and will be processed soon.`,
        [
          {
            text: 'View Invoice',
            onPress: () => router.push(`/invoice?orderId=${order.id}`)
          },
          {
            text: 'Continue Shopping',
            onPress: () => router.push('/(customer)')
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to place order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleClearCart = () => {
    if (items.length === 0) return;
    
    Alert.alert(
      'Clear Cart',
      'Are you sure you want to clear your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          onPress: () => clearCart(),
          style: 'destructive',
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        {returnTo && (
          <Pressable 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <AntDesign name="arrowleft" size={20} color={colors.text} />
          </Pressable>
        )}
        <Text style={styles.title}>Your Cart</Text>
        {items.length > 0 && (
          <Button
            title="Clear"
            onPress={handleClearCart}
            variant="outline"
            size="small"
          />
        )}
      </View>
      
      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Your cart is empty</Text>
          <Button
            title="Browse Products"
            onPress={() => router.push('/(customer)')}
            style={styles.browseButton}
          />
        </View>
      ) : (
        <>
          <ScrollView style={styles.itemsContainer}>
            {items.map((item) => (
              <CartItemComponent
                key={`${item.productId}-${item.variationId}`}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeFromCart}
              />
            ))}
          </ScrollView>
          
          <View style={styles.footer}>
            {totalSavings > 0 && (
              <View style={styles.savingsContainer}>
                <View style={styles.savingsRow}>
                  <Text style={styles.savingsLabel}>Original Total:</Text>
                  <Text style={styles.originalTotalText}>₹{Math.round(originalTotal)}</Text>
                </View>
                <View style={styles.savingsRow}>
                  <Text style={styles.savingsLabel}>You Save:</Text>
                  <Text style={styles.savingsAmount}>-₹{Math.round(totalSavings)}</Text>
                </View>
                <View style={styles.divider} />
              </View>
            )}
            
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalAmount}>₹{Math.round(totalAmount)}</Text>
            </View>
            
            <View style={styles.messageContainer}>
              <Text style={styles.messageLabel}>Message for the shop (optional)</Text>
              <TextInput
                style={styles.messageInput}
                value={orderMessage}
                onChangeText={setOrderMessage}
                placeholder="Add any special instructions or notes..."
                placeholderTextColor={colors.textLight}
                multiline
                numberOfLines={3}
                maxLength={200}
              />
            </View>
            
            <Button
              title="Place Order"
              onPress={handlePlaceOrder}
              loading={isPlacingOrder}
              fullWidth
            />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    color: colors.textLight,
    marginBottom: 16,
  },
  browseButton: {
    marginTop: 16,
  },
  itemsContainer: {
    flex: 1,
    padding: 8,
  },
  footer: {
    padding: 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  savingsContainer: {
    marginBottom: 8,
  },
  savingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  savingsLabel: {
    fontSize: 13,
    color: colors.textLight,
  },
  originalTotalText: {
    fontSize: 13,
    color: colors.textLight,
    textDecorationLine: 'line-through',
  },
  savingsAmount: {
    fontSize: 13,
    color: colors.success,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginTop: 4,
    marginBottom: 4,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  messageContainer: {
    marginBottom: 12,
  },
  messageLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 6,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.white,
    textAlignVertical: 'top',
    minHeight: 60,
  },
});
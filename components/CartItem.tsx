import React, { useState } from 'react';
import { StyleSheet, View, Text, Image, Pressable, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CartItem as CartItemType, calculateDiscountedPrice } from '@/types';
import { colors } from '@/constants/colors';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (productId: string, variationId: string, quantity: number) => void;
  onRemove: (productId: string, variationId: string) => void;
}

export const CartItemComponent: React.FC<CartItemProps> = ({
  item,
  onUpdateQuantity,
  onRemove,
}) => {
  const { product, variationId, quantity } = item;
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(quantity.toString());
  
  const variation = product.variations.find(v => v.id === variationId);
  const originalPrice = variation ? variation.price : product.price;
  
  // Apply product-level discount if available
  const itemPrice = product.discount 
    ? calculateDiscountedPrice(originalPrice, product.discount)
    : originalPrice;
  
  const totalPrice = itemPrice * quantity;
  const hasDiscount = product.discount && itemPrice < originalPrice;

  const handleIncrement = () => {
    const newQuantity = quantity + 1;
    onUpdateQuantity(product.id, variationId, newQuantity);
    setInputValue(newQuantity.toString());
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      const newQuantity = quantity - 1;
      onUpdateQuantity(product.id, variationId, newQuantity);
      setInputValue(newQuantity.toString());
    } else {
      onRemove(product.id, variationId);
    }
  };

  const handleQuantityPress = () => {
    setIsEditing(true);
    setInputValue(quantity.toString());
  };

  const handleQuantitySubmit = () => {
    const newQuantity = parseInt(inputValue) || 1;
    const validQuantity = Math.max(1, newQuantity);
    onUpdateQuantity(product.id, variationId, validQuantity);
    setInputValue(validQuantity.toString());
    setIsEditing(false);
  };

  const handleQuantityBlur = () => {
    handleQuantitySubmit();
  };

  const handleRemove = () => {
    onRemove(product.id, variationId);
  };

  return (
    <View style={styles.container}>
      <Image source={{ uri: product.imageUrl }} style={styles.image} />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={1}>{product.name}</Text>
            {variation && (
              <View style={styles.variationContainer}>
                <Text style={styles.variation}>{variation.size} • {variation.variety}</Text>
                {variation.description && (
                  <Text style={styles.variationDescription} numberOfLines={1}>
                    {variation.description}
                  </Text>
                )}
              </View>
            )}
          </View>
          
          <Pressable 
            onPress={handleRemove} 
            style={({ pressed }) => [styles.removeButton, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="trash" size={18} color={colors.error} />
          </Pressable>
        </View>
        
        <View style={styles.footer}>
          <View style={styles.priceContainer}>
            {hasDiscount && (
              <Text style={styles.originalPrice}>₹{Math.round(originalPrice * quantity)}</Text>
            )}
            <Text style={styles.price}>₹{Math.round(totalPrice)}</Text>
          </View>
          
          <View style={styles.quantityContainer}>
            <Pressable 
              onPress={handleDecrement}
              style={({ pressed }) => [styles.quantityButton, pressed && { opacity: 0.7 }]}
            >
              <Ionicons name="remove" size={16} color={colors.text} />
            </Pressable>
            
            {isEditing ? (
              <TextInput
                style={styles.quantityInput}
                value={inputValue}
                onChangeText={setInputValue}
                onSubmitEditing={handleQuantitySubmit}
                onBlur={handleQuantityBlur}
                keyboardType="numeric"
                selectTextOnFocus
                autoFocus
              />
            ) : (
              <Pressable onPress={handleQuantityPress}>
                <Text style={styles.quantity}>{quantity}</Text>
              </Pressable>
            )}
            
            <Pressable 
              onPress={handleIncrement}
              style={({ pressed }) => [styles.quantityButton, pressed && { opacity: 0.7 }]}
            >
              <Ionicons name="add" size={16} color={colors.text} />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 6,
    backgroundColor: colors.border,
  },
  content: {
    flex: 1,
    marginLeft: 8,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 1,
    marginRight: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  variationContainer: {
    marginTop: 2,
  },
  variation: {
    fontSize: 12,
    color: colors.textLight,
    fontWeight: '500',
  },
  variationDescription: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 1,
    fontStyle: 'italic',
  },
  removeButton: {
    padding: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  originalPrice: {
    fontSize: 12,
    color: colors.textLight,
    textDecorationLine: 'line-through',
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  quantityButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.white,
  },
  quantity: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 18,
    fontWeight: '700',
    minWidth: 45,
    textAlign: 'center',
    backgroundColor: colors.white,
    color: colors.text,
  },
  quantityInput: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 18,
    fontWeight: '700',
    minWidth: 45,
    textAlign: 'center',
    backgroundColor: colors.white,
    borderRadius: 2,
    color: colors.text,
  },
});
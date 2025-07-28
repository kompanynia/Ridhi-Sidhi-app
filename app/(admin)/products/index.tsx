import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, Pressable, Image, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Edit, Trash2, Package } from 'lucide-react-native';
import { SearchBar } from '@/components/SearchBar';
import { colors } from '@/constants/colors';
import { useProductStore } from '@/stores/productStore';
import { Product } from '@/types';

export default function ProductsScreen() {
  const router = useRouter();
  const { 
    products, 
    fetchProducts, 
    deleteProduct,
    isLoading,
  } = useProductStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProducts(products);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = products.filter(product => 
        product.name.toLowerCase().includes(query) || 
        product.company.toLowerCase().includes(query)
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, products]);

  const handleAddProduct = () => {
    router.push('/(admin)/products/add');
  };

  const handleEditProduct = (productId: string) => {
    router.push(`/(admin)/products/edit?id=${productId}`);
  };

  const handleDeleteProduct = (productId: string) => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this product?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          onPress: () => deleteProduct(productId),
          style: 'destructive',
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Product }) => (
    <View style={styles.productItem}>
      <Image 
        source={{ uri: item.imageUrl }} 
        style={styles.productImage}
        resizeMode="cover"
      />
      
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.productCompany}>{item.company}</Text>
        <Text style={styles.productPrice}>₹{item.price}</Text>
        
        <View style={styles.locationTags}>
          {item.locations.map(location => (
            <View key={location} style={styles.locationTag}>
              <Text style={styles.locationText}>{location}</Text>
            </View>
          ))}
        </View>
      </View>
      
      <View style={styles.actions}>
        <Pressable 
          style={({ pressed }) => [
            styles.actionButton,
            pressed && { opacity: 0.7 }
          ]}
          onPress={() => handleEditProduct(item.id)}
        >
          <Edit size={18} color={colors.primary} />
        </Pressable>
        
        <Pressable 
          style={({ pressed }) => [
            styles.actionButton,
            styles.deleteButton,
            pressed && { opacity: 0.7 }
          ]}
          onPress={() => handleDeleteProduct(item.id)}
        >
          <Trash2 size={18} color={colors.error} />
        </Pressable>
      </View>
    </View>
  );

  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Products',
          headerLeft: () => (
            <Package size={24} color={colors.primary} style={{ marginLeft: 8 }} />
          ),
        }} 
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search products..."
        />
        
        <Pressable 
          style={styles.addButton}
          onPress={handleAddProduct}
        >
          <Plus size={24} color={colors.white} />
        </Pressable>
      </View>
      
      <FlatList
        data={filteredProducts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery ? 'No products match your search' : 'No products available'}
            </Text>
          </View>
        }
      />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  listContent: {
    padding: 16,
  },
  productItem: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  productImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: colors.border,
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  productCompany: {
    fontSize: 14,
    color: colors.textLight,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 4,
  },
  locationTags: {
    flexDirection: 'row',
    marginTop: 4,
  },
  locationTag: {
    backgroundColor: colors.card,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
  },
  locationText: {
    fontSize: 12,
    color: colors.textLight,
  },
  actions: {
    justifyContent: 'space-between',
    paddingLeft: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: colors.card,
    marginBottom: 4,
  },
  deleteButton: {
    backgroundColor: 'rgba(229, 115, 115, 0.1)',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
  },
});
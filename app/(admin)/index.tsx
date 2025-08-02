import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Alert, Modal, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/stores/authStore';
import { useProductStore } from '@/stores/productStore';
import { useCartStore } from '@/stores/cartStore';
import { useTrendingStore } from '@/stores/trendingStore';
import { trpc, isBackendConfigured } from '@/lib/trpc';
import { Button } from '@/components/Button';
import { Product } from '@/types';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { products, fetchProducts } = useProductStore();
  const { orders, fetchOrders } = useCartStore();
  const { trendingProductIds, setTrendingProducts, loadTrendingProducts, isLoading: trendingLoading } = useTrendingStore();
  const [showTrendingModal, setShowTrendingModal] = useState(false);
  const [selectedTrendingProducts, setSelectedTrendingProducts] = useState<string[]>([]);
  
  // Only use tRPC if backend is configured
  const trendingQuery = isBackendConfigured() ? trpc.trending.get.useQuery(undefined, {
    refetchOnWindowFocus: false
  }) : { data: [] };
  const updateTrendingMutation = isBackendConfigured() ? trpc.trending.update.useMutation() : null;
  
  useEffect(() => {
    fetchProducts();
    fetchOrders();
    loadTrendingProducts();
  }, []);
  
  useEffect(() => {
    // Load current trending products when they change
    setSelectedTrendingProducts(trendingProductIds);
  }, [trendingProductIds]);
  
  const udaipurOrders = orders.filter(order => order.location === 'Udaipur');
  const munganaOrders = orders.filter(order => order.location === 'Mungana');

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          onPress: async () => {
            try {
              console.log('Admin logout initiated...');
              await logout();
              console.log('Admin logout completed, navigating to login...');
              router.replace('/login');
            } catch (error) {
              console.error('Admin logout error:', error);
              // Force navigation to login even if logout fails
              router.replace('/login');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const navigateToProducts = () => {
    router.push('/(admin)/products');
  };

  const navigateToOrders = () => {
    router.push('/(admin)/orders');
  };

  const handleTrendingProductToggle = (productId: string) => {
    setSelectedTrendingProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else if (prev.length < 5) { // Limit to 5 trending products
        return [...prev, productId];
      } else {
        Alert.alert('Limit Reached', 'You can select maximum 5 trending products.');
        return prev;
      }
    });
  };

  const saveTrendingProducts = async () => {
    try {
      await setTrendingProducts(selectedTrendingProducts);
      Alert.alert('Success', `${selectedTrendingProducts.length} trending products updated!`);
      setShowTrendingModal(false);
    } catch (error) {
      console.error('Failed to save trending products:', error);
      Alert.alert('Error', 'Failed to update trending products. Please try again.');
    }
  };

  const renderTrendingProductItem = ({ item }: { item: Product }) => {
    const isSelected = selectedTrendingProducts.includes(item.id);
    return (
      <Pressable 
        style={[styles.trendingProductItem, isSelected && styles.selectedTrendingProduct]}
        onPress={() => handleTrendingProductToggle(item.id)}
      >
        <View style={styles.trendingProductInfo}>
          <Text style={styles.trendingProductName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.trendingProductCompany} numberOfLines={1}>{item.company}</Text>
        </View>
        {isSelected && (
          <Ionicons name="checkmark" size={20} color={colors.primary} />
        )}
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.name}>{user?.name || 'Admin'}</Text>
          </View>
          <Pressable 
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && { opacity: 0.7 }
            ]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out" size={20} color={colors.text} />
          </Pressable>
        </View>
        
        <View style={styles.statsContainer}>
          <Pressable 
            style={styles.statCard}
            onPress={navigateToProducts}
          >
            <Ionicons name="cube" size={24} color={colors.primary} />
            <Text style={styles.statValue}>{products.length}</Text>
            <Text style={styles.statLabel}>Products</Text>
          </Pressable>
          
          <Pressable 
            style={styles.statCard}
            onPress={navigateToOrders}
          >
            <Ionicons name="clipboard" size={24} color={colors.primary} />
            <Text style={styles.statValue}>{orders.length}</Text>
            <Text style={styles.statLabel}>Total Orders</Text>
          </Pressable>
        </View>
        
        <Text style={styles.sectionTitle}>Orders by Location</Text>
        
        <View style={styles.locationStatsContainer}>
          <View style={styles.locationCard}>
            <View style={styles.locationHeader}>
              <Ionicons name="location" size={20} color={colors.primary} />
              <Text style={styles.locationName}>Udaipur</Text>
            </View>
            <Text style={styles.locationValue}>{udaipurOrders.length}</Text>
            <Text style={styles.locationLabel}>Orders</Text>
          </View>
          
          <View style={styles.locationCard}>
            <View style={styles.locationHeader}>
              <Ionicons name="location" size={20} color={colors.primary} />
              <Text style={styles.locationName}>Mungana</Text>
            </View>
            <Text style={styles.locationValue}>{munganaOrders.length}</Text>
            <Text style={styles.locationLabel}>Orders</Text>
          </View>
        </View>
        
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <View style={styles.actionsContainer}>
          <Pressable 
            style={styles.actionButton}
            onPress={() => router.push('/(admin)/products/add')}
          >
            <Text style={styles.actionText}>Add New Product</Text>
          </Pressable>
          
          <Pressable 
            style={styles.actionButton}
            onPress={() => router.push('/(admin)/orders')}
          >
            <Text style={styles.actionText}>View All Orders</Text>
          </Pressable>
          
          <Pressable 
            style={[styles.actionButton, styles.trendingButton]}
            onPress={() => setShowTrendingModal(true)}
          >
            <Ionicons name="trending-up" size={20} color={colors.white} />
            <Text style={styles.actionText}>Manage Trending Products</Text>
          </Pressable>
        </View>
        
        {trendingProductIds.length > 0 && (
          <View style={styles.trendingPreview}>
            <Text style={styles.sectionTitle}>Current Trending Products</Text>
            <Text style={styles.trendingCount}>
              {trendingProductIds.length} product{trendingProductIds.length !== 1 ? 's' : ''} selected
            </Text>
          </View>
        )}
      </ScrollView>
      
      {/* Trending Products Modal */}
      <Modal
        visible={showTrendingModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Trending Products</Text>
            <Pressable 
              onPress={() => setShowTrendingModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>
          
          <Text style={styles.modalSubtitle}>
            Select up to 5 products to highlight as trending ({selectedTrendingProducts.length}/5)
          </Text>
          
          <FlatList
            data={products}
            renderItem={renderTrendingProductItem}
            keyExtractor={(item) => item.id}
            style={styles.trendingProductsList}
          />
          
          <View style={styles.modalFooter}>
            <Button
              title="Cancel"
              variant="outline"
              onPress={() => setShowTrendingModal(false)}
              style={styles.modalButton}
            />
            <Button
              title="Save Changes"
              onPress={saveTrendingProducts}
              style={styles.modalButton}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: colors.textLight,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  logoutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.card,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 6,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textLight,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
    marginTop: 8,
  },
  locationStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  locationCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 6,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  locationValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  locationLabel: {
    fontSize: 14,
    color: colors.textLight,
  },
  actionsContainer: {
    marginBottom: 24,
  },
  actionButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  trendingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  trendingPreview: {
    marginTop: 16,
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 8,
  },
  trendingCount: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textLight,
    padding: 16,
    paddingBottom: 8,
  },
  trendingProductsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  trendingProductItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.white,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedTrendingProduct: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  trendingProductInfo: {
    flex: 1,
    marginRight: 12,
  },
  trendingProductName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  trendingProductCompany: {
    fontSize: 14,
    color: colors.textLight,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
  modalButton: {
    flex: 1,
  },
});
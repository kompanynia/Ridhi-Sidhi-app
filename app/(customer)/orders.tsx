import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, Pressable, RefreshControl, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AntDesign, Feather, Entypo } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { generateAndDownloadPDF } from '@/utils/invoice';
import { Order } from '@/types';

export default function CustomerOrdersScreen() {
  const router = useRouter();
  const { orders, fetchOrders, subscribeToOrders } = useCartStore();
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  
  // Filter orders for current user
  const userOrders = orders.filter(order => order.userId === user?.id);
  
  console.log('Customer orders screen - Total orders:', orders.length, 'User orders:', userOrders.length, 'User ID:', user?.id);
  
  // Sort orders by date (newest first)
  const sortedOrders = [...userOrders].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  useEffect(() => {
    console.log('Customer orders screen mounted, fetching orders...');
    fetchOrders();
    
    // Subscribe to real-time updates
    const unsubscribe = subscribeToOrders();
    
    return () => {
      console.log('Customer orders screen unmounting, unsubscribing...');
      unsubscribe();
    };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const handleOrderPress = (order: Order) => {
    router.push(`/invoice?orderId=${order.id}`);
  };

  const handleDownloadPDF = async (order: Order, event: any) => {
    event.stopPropagation();
    try {
      await generateAndDownloadPDF(order);
      if (Platform.OS !== 'web') {
        Alert.alert('Success', 'Invoice PDF has been generated and shared!');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return colors.success;
      case 'cancelled':
        return colors.error;
      default:
        return colors.secondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Processing';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };

  const renderItem = ({ item }: { item: Order }) => (
    <Pressable 
      style={({ pressed }) => [
        styles.orderItem,
        pressed && { opacity: 0.9 }
      ]}
      onPress={() => handleOrderPress(item)}
    >
      <View style={styles.orderContent}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderId}>Order #{item.id.slice(-8)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>
        
        <Text style={styles.orderDate}>
          {new Date(item.date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
        
        <View style={styles.orderDetails}>
          <View style={styles.orderInfo}>
            <Text style={styles.orderAmount}>₹{item.totalAmount.toFixed(2)}</Text>
            <View style={styles.itemInfo}>
              <Feather name="package" size={14} color={colors.textLight} />
              <Text style={styles.orderItemCount}>
                {item.items.length} {item.items.length === 1 ? 'item' : 'items'}
              </Text>
            </View>
          </View>
          
          <View style={styles.locationContainer}>
            <Entypo name="location-pin" size={16} color={colors.primary} style={styles.locationIcon} />
            <Text style={styles.locationText}>{item.location}</Text>
          </View>
        </View>
        
        <View style={styles.itemsPreview}>
          <Text style={styles.itemsPreviewText}>
            {item.items.slice(0, 2).map(item => item.product.name).join(', ')}
            {item.items.length > 2 && ` +${item.items.length - 2} more`}
          </Text>
        </View>
        
        <Pressable
          style={styles.downloadButton}
          onPress={(event) => handleDownloadPDF(item, event)}
        >
          <AntDesign name="download" size={14} color={colors.primary} />
          <Text style={styles.downloadText}>PDF</Text>
        </Pressable>
      </View>
      
      <AntDesign name="right" size={20} color={colors.textLight} />
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>My Orders</Text>
        <Text style={styles.subtitle}>{userOrders.length} orders</Text>
      </View>
      
      <FlatList
        data={sortedOrders}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="package" size={48} color={colors.textLight} />
            <Text style={styles.emptyTitle}>No orders yet</Text>
            <Text style={styles.emptyText}>
              Start shopping to see your orders here
            </Text>
            <Pressable 
              style={styles.shopButton}
              onPress={() => router.push('/(customer)')}
            >
              <Text style={styles.shopButtonText}>Start Shopping</Text>
            </Pressable>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 2,
  },
  listContent: {
    padding: 16,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  orderContent: {
    flex: 1,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },
  orderDate: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 8,
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderInfo: {
    alignItems: 'flex-start',
  },
  orderAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 2,
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderItemCount: {
    fontSize: 14,
    color: colors.textLight,
    marginLeft: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    marginRight: 4,
  },
  locationText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  itemsPreview: {
    marginTop: 4,
  },
  itemsPreviewText: {
    fontSize: 14,
    color: colors.textLight,
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 24,
  },
  shopButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: colors.card,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.primary,
    alignSelf: 'flex-start',
  },
  downloadText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
    marginLeft: 4,
  },
});
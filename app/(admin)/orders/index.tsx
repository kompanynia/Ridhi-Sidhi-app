import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, FlatList, Pressable, RefreshControl, Alert, Platform } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AntDesign, Feather, Entypo } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { useCartStore } from '@/stores/cartStore';
import { generateAndDownloadPDF } from '@/utils/invoice';
import { Order, Location } from '@/types';

export default function AdminOrdersScreen() {
  const router = useRouter();
  const { orders, updateOrderStatus, fetchOrders, subscribeToOrders } = useCartStore();
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'last7' | 'month'>('all');

  const filteredOrders = useMemo(() => {
    let list = selectedLocation ? orders.filter(o => o.location === selectedLocation) : orders;

    if (statusFilter !== 'all') {
      list = list.filter(o => o.status === statusFilter);
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      let start: Date | null = null;
      if (dateFilter === 'today') {
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (dateFilter === 'last7') {
        start = new Date(now);
        start.setDate(now.getDate() - 6);
        start.setHours(0, 0, 0, 0);
      } else if (dateFilter === 'month') {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
      }
      if (start) {
        list = list.filter(o => new Date(o.date).getTime() >= start!.getTime());
      }
    }

    return list;
  }, [orders, selectedLocation, statusFilter, dateFilter]);
    
  console.log('Admin orders screen - Total orders:', orders.length, 'Filtered orders:', filteredOrders.length);
  console.log('Sample order data:', orders[0]);

  const sortedOrders = useMemo(() => (
    [...filteredOrders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  ), [filteredOrders]);

  useEffect(() => {
    console.log('Admin orders screen mounted, fetching orders...');
    fetchOrders();
    
    // Subscribe to real-time updates
    const unsubscribe = subscribeToOrders();
    
    return () => {
      console.log('Admin orders screen unmounting, unsubscribing...');
      unsubscribe();
    };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const handleLocationFilter = (location: Location | null) => {
    setSelectedLocation(location === selectedLocation ? null : location);
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

  const handleStatusUpdate = async (orderId: string, status: 'pending' | 'completed' | 'cancelled') => {
    try {
      await updateOrderStatus(orderId, status);
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <AntDesign name="checkcircle" size={16} color={colors.success} />;
      case 'cancelled':
        return <AntDesign name="closecircle" size={16} color={colors.error} />;
      default:
        return <Feather name="clock" size={16} color={colors.secondary} />;
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
    <View style={styles.orderItem}>
      <Pressable 
        style={styles.orderContent}
        onPress={() => handleOrderPress(item)}
      >
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderId}>Order #{item.id.slice(-8)}</Text>
            {item.userName && (
              <Text style={styles.customerName}>Customer: {item.userName}</Text>
            )}
          </View>
          <Text style={styles.orderDate}>
            {new Date(item.date).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>
        
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
        
        {item.message && (
          <View style={styles.messageContainer}>
            <Text style={styles.messageLabel}>Customer Message:</Text>
            <Text style={styles.messageText}>{item.message}</Text>
          </View>
        )}
        
        <Pressable
          style={styles.downloadButton}
          onPress={(event) => handleDownloadPDF(item, event)}
        >
          <AntDesign name="download" size={16} color={colors.primary} />
          <Text style={styles.downloadText}>Download PDF</Text>
        </Pressable>
      </Pressable>
      
      <View style={styles.statusSection}>
        <View style={styles.currentStatus}>
          {getStatusIcon(item.status)}
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusText(item.status)}
          </Text>
        </View>
        
        <View style={styles.statusActions}>
          {item.status === 'pending' && (
            <>
              <Pressable
                style={[styles.statusButton, { backgroundColor: colors.success }]}
                onPress={() => handleStatusUpdate(item.id, 'completed')}
              >
                <Text style={styles.statusButtonText}>Complete</Text>
              </Pressable>
              <Pressable
                style={[styles.statusButton, { backgroundColor: colors.error }]}
                onPress={() => handleStatusUpdate(item.id, 'cancelled')}
              >
                <Text style={styles.statusButtonText}>Cancel</Text>
              </Pressable>
            </>
          )}
          {item.status !== 'pending' && (
            <Pressable
              style={[styles.statusButton, { backgroundColor: colors.secondary }]}
              onPress={() => handleStatusUpdate(item.id, 'pending')}
            >
              <Text style={styles.statusButtonText}>Reset</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Orders',
          headerLeft: () => (
            <Feather name="clipboard" size={24} color={colors.primary} style={{ marginLeft: 8 }} />
          ),
        }} 
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Orders Management</Text>
        <Text style={styles.subtitle}>{orders.length} total orders</Text>
      </View>
      
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Filter by Location:</Text>
        <View style={styles.filterOptions}>
          <Pressable
            testID="filter-location-all"
            style={[
              styles.filterOption,
              selectedLocation === null && styles.selectedFilter,
            ]}
            onPress={() => handleLocationFilter(null)}
          >
            <Text 
              style={[
                styles.filterText,
                selectedLocation === null && styles.selectedFilterText,
              ]}
            >
              All ({orders.length})
            </Text>
          </Pressable>
          
          <Pressable
            testID="filter-location-udaipur"
            style={[
              styles.filterOption,
              selectedLocation === 'Udaipur' && styles.selectedFilter,
            ]}
            onPress={() => handleLocationFilter('Udaipur')}
          >
            <Text 
              style={[
                styles.filterText,
                selectedLocation === 'Udaipur' && styles.selectedFilterText,
              ]}
            >
              Udaipur ({orders.filter(o => o.location === 'Udaipur').length})
            </Text>
          </Pressable>
          
          <Pressable
            testID="filter-location-mungana"
            style={[
              styles.filterOption,
              selectedLocation === 'Mungana' && styles.selectedFilter,
            ]}
            onPress={() => handleLocationFilter('Mungana')}
          >
            <Text 
              style={[
                styles.filterText,
                selectedLocation === 'Mungana' && styles.selectedFilterText,
              ]}
            >
              Mungana ({orders.filter(o => o.location === 'Mungana').length})
            </Text>
          </Pressable>
        </View>

        <Text style={[styles.filterLabel, { marginTop: Platform.select({ web: 6, default: 12 }) }]}>Filter by Status:</Text>
        <View style={styles.filterOptions}>
          {(['all','pending','completed','cancelled'] as const).map(s => (
            <Pressable
              key={s}
              testID={`filter-status-${s}`}
              style={[styles.filterOption, statusFilter === s && styles.selectedFilter]}
              onPress={() => setStatusFilter(s)}
            >
              <Text style={[styles.filterText, statusFilter === s && styles.selectedFilterText]}>
                {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.filterLabel, { marginTop: Platform.select({ web: 6, default: 12 }) }]}>Filter by Date:</Text>
        <View style={styles.filterOptions}>
          {([
            { key: 'all', label: 'All' },
            { key: 'today', label: 'Today' },
            { key: 'last7', label: 'Last 7 days' },
            { key: 'month', label: 'This month' },
          ] as const).map(opt => (
            <Pressable
              key={opt.key}
              testID={`filter-date-${opt.key}`}
              style={[styles.filterOption, dateFilter === opt.key && styles.selectedFilter]}
              onPress={() => setDateFilter(opt.key)}
            >
              <Text style={[styles.filterText, dateFilter === opt.key && styles.selectedFilterText]}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      
      <FlatList
        data={sortedOrders}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        testID="orders-list"
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
            <Text style={styles.emptyTitle}>No orders found</Text>
            <Text style={styles.emptyText}>
              {selectedLocation 
                ? `No orders for ${selectedLocation}` 
                : 'No orders match current filters'}
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
  filterContainer: {
    padding: Platform.select({ web: 8, default: 16 }),
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterLabel: {
    fontSize: Platform.select({ web: 14, default: 16 }),
    fontWeight: '500',
    color: colors.text,
    marginBottom: Platform.select({ web: 4, default: 8 }),
  },
  filterOptions: {
    flexDirection: 'row',
    gap: Platform.select({ web: 4, default: 8 }),
    flexWrap: 'wrap',
  },
  filterOption: {
    paddingHorizontal: Platform.select({ web: 8, default: 12 }),
    paddingVertical: Platform.select({ web: 4, default: 6 }),
    borderRadius: Platform.select({ web: 12, default: 16 }),
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedFilter: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: Platform.select({ web: 12, default: 14 }),
    color: colors.text,
    fontWeight: '500',
  },
  selectedFilterText: {
    color: colors.white,
  },
  listContent: {
    padding: 16,
  },
  orderItem: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  orderContent: {
    padding: 16,
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
  customerName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
    marginTop: 2,
  },
  orderDate: {
    fontSize: 14,
    color: colors.textLight,
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
  statusSection: {
    backgroundColor: colors.card,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  statusActions: {
    flexDirection: 'row',
    gap: 8,
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
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
  },
  messageContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: colors.card,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  messageLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 2,
  },
  messageText: {
    fontSize: 14,
    color: colors.text,
    fontStyle: 'italic',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.card,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  downloadText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
    marginLeft: 6,
  },
});
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { CartItem, Product, Order, Location, calculateDiscountedPrice, ProductVariation } from '@/types';

interface CartState {
  items: CartItem[];
  orders: Order[];
  isLoading: boolean;
  addToCart: (product: Product, variationId: string, quantity: number) => void;
  removeFromCart: (productId: string, variationId: string) => void;
  updateQuantity: (productId: string, variationId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalAmount: () => number;
  getItemCount: () => number;
  placeOrder: (location: Location, userId: string, message?: string) => Promise<Order>;
  fetchOrders: () => Promise<void>;
  updateOrderStatus: (orderId: string, status: 'pending' | 'completed' | 'cancelled') => Promise<void>;
  subscribeToOrders: () => () => void;
  debugOrders: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  orders: [],
  isLoading: false,
  
  addToCart: (product, variationId, quantity) => {
    set(state => {
      const existingItemIndex = state.items.findIndex(
        item => item.productId === product.id && item.variationId === variationId
      );
      
      if (existingItemIndex >= 0) {
        // Update quantity if item already exists
        const updatedItems = [...state.items];
        updatedItems[existingItemIndex].quantity += quantity;
        return { items: updatedItems };
      } else {
        // Add new item
        return {
          items: [
            ...state.items,
            {
              productId: product.id,
              product,
              variationId,
              quantity
            }
          ]
        };
      }
    });
  },
  
  removeFromCart: (productId, variationId) => {
    set(state => ({
      items: state.items.filter(
        item => !(item.productId === productId && item.variationId === variationId)
      )
    }));
  },
  
  updateQuantity: (productId, variationId, quantity) => {
    set(state => ({
      items: state.items.map(item => 
        (item.productId === productId && item.variationId === variationId)
          ? { ...item, quantity }
          : item
      )
    }));
  },
  
  clearCart: () => {
    set({ items: [] });
  },
  
  getTotalAmount: () => {
    return get().items.reduce((total, item) => {
      const variation = item.product.variations.find(v => v.id === item.variationId);
      if (!variation) return total;
      
      // Use only product-level discount
      const activeDiscount = item.product.discount;
      const itemPrice = activeDiscount 
        ? calculateDiscountedPrice(variation.price, activeDiscount)
        : variation.price;
      
      return total + itemPrice * item.quantity;
    }, 0);
  },
  
  getItemCount: () => {
    return get().items.reduce((count, item) => count + item.quantity, 0);
  },
  
  placeOrder: async (location, userId, message) => {
    const items = get().items;
    const totalAmount = get().getTotalAmount();
    
    set({ isLoading: true });
    
    try {
      // Create order in database
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: userId,
          total_amount: totalAmount,
          location,
          status: 'pending',
          message: message || null
        })
        .select()
        .single();
      
      if (orderError) throw orderError;
      
      // Create order items with discounted prices and snapshots
      const orderItems = items.map(item => {
        const variation = item.product.variations.find(v => v.id === item.variationId);
        if (!variation) throw new Error('Variation not found');
        
        // Use only product-level discount
        const activeDiscount = item.product.discount;
        const itemPrice = activeDiscount 
          ? calculateDiscountedPrice(variation.price, activeDiscount)
          : variation.price;
        
        // Create snapshots of product and variation data at time of order
        const productSnapshot = {
          id: item.product.id,
          name: item.product.name,
          description: item.product.description,
          imageUrl: item.product.imageUrl,
          company: item.product.company,
          category: item.product.category,
          discount: activeDiscount
        };
        
        const variationSnapshot = {
          id: variation.id,
          size: variation.size,
          variety: variation.variety,
          price: variation.price,
          description: variation.description,
          imageUrl: variation.imageUrl,
          availableLocations: variation.availableLocations
        };
        
        return {
          order_id: orderData.id,
          product_id: item.productId,
          variation_id: item.variationId,
          quantity: item.quantity,
          price: itemPrice,
          original_price: variation.price,
          discount_applied: activeDiscount || null,
          product_snapshot: productSnapshot,
          variation_snapshot: variationSnapshot
        };
      });
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);
      
      if (itemsError) throw itemsError;
      
      // Fetch user information for the new order
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('name, email, phone')
        .eq('id', userId)
        .single();
      
      if (userError) {
        console.error('Error fetching user data for new order:', userError);
      }

      const newOrder: Order = {
        id: orderData.id,
        userId: orderData.user_id,
        userName: userData?.name,
        userEmail: userData?.email,
        userPhone: userData?.phone,
        items,
        totalAmount: orderData.total_amount,
        location: orderData.location as Location,
        date: orderData.created_at,
        status: orderData.status as 'pending' | 'completed' | 'cancelled',
        message: orderData.message || undefined
      };
      
      set(state => ({
        orders: [newOrder, ...state.orders],
        items: [], // Clear cart after order
        isLoading: false
      }));
      
      console.log('Order placed successfully:', newOrder.id);
      
      return newOrder;
    } catch (error) {
      set({ isLoading: false });
      console.error('Error placing order:', error);
      throw error;
    }
  },
  
  fetchOrders: async () => {
    set({ isLoading: true });
    try {
      console.log('Fetching orders from database...');
      
      // Always fetch orders and users separately to avoid RLS issues
      const { data: ordersOnly, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (*)
          )
        `)
        .order('created_at', { ascending: false });
      
      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
        throw ordersError;
      }
      
      // Fetch all users separately
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, email, phone');
      
      if (usersError) {
        console.log('Could not fetch users separately:', usersError);
        // Continue without user data but log the error
        console.error('Users fetch error details:', usersError);
      }
      
      console.log('Fetched users data:', usersData?.length || 0, 'users');
      console.log('Sample user data:', usersData?.[0]);
      
      // Manually join the data
      const ordersData = ordersOnly?.map(order => ({
        ...order,
        users: usersData?.find(user => user.id === order.user_id) || null
      })) || null;
      
      console.log(`Fetched ${ordersData?.length || 0} orders from database`);
      
      if (!ordersData) {
        set({ orders: [], isLoading: false });
        return;
      }
      
      const orders: Order[] = ordersData.map(orderData => {
        const items: CartItem[] = orderData.order_items?.map((item: any) => {
          // Use snapshot data if available, otherwise fallback to current product data
          const productSnapshot = item.product_snapshot;
          const variationSnapshot = item.variation_snapshot;
          const currentProduct = item.products;
          
          // Create product data from snapshot or current data
          const productData = productSnapshot ? {
            id: productSnapshot.id,
            name: productSnapshot.name,
            description: productSnapshot.description,
            price: currentProduct.price, // Keep current base price
            imageUrl: productSnapshot.imageUrl,
            company: productSnapshot.company,
            category: productSnapshot.category,
            variations: currentProduct.variations, // Keep current variations structure
            locations: currentProduct.locations,
            discount: productSnapshot.discount,
          } : {
            id: currentProduct.id,
            name: currentProduct.name,
            description: currentProduct.description,
            price: currentProduct.price,
            imageUrl: currentProduct.image_url,
            company: currentProduct.company,
            category: currentProduct.category,
            variations: currentProduct.variations,
            locations: currentProduct.locations,
            discount: currentProduct.discount,
          };
          
          // If we have variation snapshot, update the specific variation in the product
          if (variationSnapshot && productData.variations) {
            const variationIndex = productData.variations.findIndex((v: ProductVariation) => v.id === item.variation_id);
            if (variationIndex >= 0) {
              productData.variations[variationIndex] = {
                id: variationSnapshot.id,
                size: variationSnapshot.size,
                variety: variationSnapshot.variety,
                price: variationSnapshot.price,
                description: variationSnapshot.description,
                imageUrl: variationSnapshot.imageUrl,
                availableLocations: variationSnapshot.availableLocations
              };
            }
          }
          
          return {
            productId: productData.id,
            product: productData,
            variationId: item.variation_id,
            quantity: item.quantity
          };
        }) || [];
        
        // Debug user data
        console.log('Order user data:', {
          orderId: orderData.id,
          userId: orderData.user_id,
          users: orderData.users,
          userName: orderData.users?.name,
          userEmail: orderData.users?.email,
          userPhone: orderData.users?.phone,
          hasUserData: !!orderData.users
        });
        
        return {
          id: orderData.id,
          userId: orderData.user_id,
          userName: orderData.users?.name,
          userEmail: orderData.users?.email,
          userPhone: orderData.users?.phone,
          items,
          totalAmount: orderData.total_amount,
          location: orderData.location as Location,
          date: orderData.created_at,
          status: orderData.status as 'pending' | 'completed' | 'cancelled',
          message: orderData.message || undefined
        };
      });
      
      console.log(`Processed ${orders.length} orders for store`);
      set({ orders, isLoading: false });
    } catch (error) {
      console.error('Error fetching orders:', error);
      set({ orders: [], isLoading: false });
    }
  },
  
  updateOrderStatus: async (orderId, status) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);
      
      if (error) throw error;
      
      set(state => ({
        orders: state.orders.map(order =>
          order.id === orderId ? { ...order, status } : order
        )
      }));
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  },
  
  subscribeToOrders: () => {
    console.log('Setting up real-time subscription for orders...');
    
    const subscription = supabase
      .channel(`orders-realtime-${Date.now()}`) // Unique channel name
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'orders' 
        }, 
        (payload) => {
          console.log('Order change detected:', payload);
          // Small delay to ensure database consistency
          setTimeout(() => {
            get().fetchOrders();
          }, 100);
        }
      )
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'order_items' 
        }, 
        (payload) => {
          console.log('Order items change detected:', payload);
          // Small delay to ensure database consistency
          setTimeout(() => {
            get().fetchOrders();
          }, 100);
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to real-time updates');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Real-time subscription error');
        }
      });
    
    return () => {
      console.log('Unsubscribing from real-time updates');
      subscription.unsubscribe();
    };
  },
  
  debugOrders: () => {
    const state = get();
    console.log('=== CART STORE DEBUG ===');
    console.log('Orders count:', state.orders.length);
    console.log('Orders:', state.orders);
    console.log('Is loading:', state.isLoading);
    console.log('========================');
  }
}));
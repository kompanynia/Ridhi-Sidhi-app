import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { Product } from '@/types';

interface TrendingState {
  trendingProductIds: string[];
  isLoading: boolean;
  setTrendingProducts: (productIds: string[]) => Promise<void>;
  addTrendingProduct: (productId: string) => Promise<void>;
  removeTrendingProduct: (productId: string) => Promise<void>;
  isTrending: (productId: string) => boolean;
  loadTrendingProducts: () => Promise<void>;
}

export const useTrendingStore = create<TrendingState>()(persist((set, get) => ({
  trendingProductIds: [],
  isLoading: false,
  
  setTrendingProducts: async (productIds: string[]) => {
    set({ isLoading: true });
    try {
      const limitedIds = productIds.slice(0, 5); // Limit to 5
      
      // First, reset all products to not trending
      const { error: resetError } = await supabase
        .from('products')
        .update({ is_trending: false })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all products
      
      if (resetError) throw resetError;
      
      // Then set the selected products as trending
      if (limitedIds.length > 0) {
        const { error: updateError } = await supabase
          .from('products')
          .update({ is_trending: true })
          .in('id', limitedIds);
        
        if (updateError) throw updateError;
      }
      
      // Update local state
      set({ trendingProductIds: limitedIds });
      
    } catch (error) {
      console.error('Failed to update trending products:', error);
      // Still update local state even if database fails
      set({ trendingProductIds: productIds.slice(0, 5) });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  
  addTrendingProduct: async (productId: string) => {
    const current = get().trendingProductIds;
    if (!current.includes(productId) && current.length < 5) {
      const newIds = [...current, productId];
      await get().setTrendingProducts(newIds);
    }
  },
  
  removeTrendingProduct: async (productId: string) => {
    const current = get().trendingProductIds;
    const newIds = current.filter(id => id !== productId);
    await get().setTrendingProducts(newIds);
  },
  
  isTrending: (productId: string) => {
    return get().trendingProductIds.includes(productId);
  },
  
  loadTrendingProducts: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id')
        .eq('is_trending', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const trendingIds = data.map(product => product.id);
      set({ trendingProductIds: trendingIds });
      
    } catch (error) {
      console.error('Failed to load trending products:', error);
      // Local storage will be automatically loaded by zustand persist
    } finally {
      set({ isLoading: false });
    }
  },
}), {
  name: 'trending-storage',
  storage: createJSONStorage(() => AsyncStorage),
  // Only persist the trending product IDs, not loading state
  partialize: (state) => ({ trendingProductIds: state.trendingProductIds }),
}));

// Load trending products on store initialization
useTrendingStore.getState().loadTrendingProducts();
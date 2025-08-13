import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Product, Location } from '@/types';

interface ProductState {
  products: Product[];
  filteredProducts: Product[];
  isLoading: boolean;
  error: string | null;
  fetchProducts: () => Promise<void>;
  filterByLocation: (location: Location) => void;
  filterByCompany: (company: string | null) => void;
  filterBySearch: (query: string) => void;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  getUniqueCompanies: () => string[];
  currentLocation: Location | null;
  currentCompanyFilter: string | null;
  currentSearchQuery: string;
  subscribeToProducts: () => () => void;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  filteredProducts: [],
  isLoading: false,
  error: null,
  currentLocation: null,
  currentCompanyFilter: null,
  currentSearchQuery: "",
  
  fetchProducts: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const products: Product[] = data.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        imageUrl: item.image_url,
        company: item.company,
        companyImageUrl: item.company_image_url,
        category: item.category,
        variations: item.variations as any,
        locations: item.locations as Location[],
        discount: item.discount as any,
      }));
      
      set({ 
        products,
        filteredProducts: products,
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch products', 
        isLoading: false 
      });
    }
  },
  
  filterByLocation: (location) => {
    const { products, currentCompanyFilter, currentSearchQuery } = get();
    
    console.log('filterByLocation called:', { location, totalProducts: products.length });
    
    let filtered = products.filter(product => 
      product.locations.includes(location)
    );
    
    console.log('After location filter:', filtered.length, 'products for location:', location);
    
    // Apply existing company filter if any
    if (currentCompanyFilter) {
      filtered = filtered.filter(product => 
        product.company === currentCompanyFilter
      );
    }
    
    // Apply existing search query if any
    if (currentSearchQuery) {
      const query = currentSearchQuery.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(query) || 
        product.description.toLowerCase().includes(query)
      );
    }
    
    set({ 
      filteredProducts: filtered,
      currentLocation: location
    });
  },
  
  filterByCompany: (company) => {
    const { products, currentLocation, currentSearchQuery } = get();
    
    console.log('filterByCompany called:', { company, currentLocation, totalProducts: products.length });
    
    let filtered = products;
    
    // Apply location filter if any
    if (currentLocation) {
      filtered = filtered.filter(product => 
        product.locations.includes(currentLocation)
      );
      console.log('After location filter:', filtered.length, 'products');
    }
    
    // Apply company filter if provided
    if (company) {
      filtered = filtered.filter(product => 
        product.company === company
      );
      console.log('After company filter:', filtered.length, 'products');
    }
    
    // Apply existing search query if any
    if (currentSearchQuery) {
      const query = currentSearchQuery.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(query) || 
        product.description.toLowerCase().includes(query)
      );
    }
    
    set({ 
      filteredProducts: filtered,
      currentCompanyFilter: company
    });
  },
  
  filterBySearch: (query) => {
    const { products, currentLocation, currentCompanyFilter } = get();
    
    let filtered = products;
    
    // Apply location filter if any
    if (currentLocation) {
      filtered = filtered.filter(product => 
        product.locations.includes(currentLocation)
      );
    }
    
    // Apply company filter if any
    if (currentCompanyFilter) {
      filtered = filtered.filter(product => 
        product.company === currentCompanyFilter
      );
    }
    
    // Apply search query
    if (query) {
      const searchQuery = query.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchQuery) || 
        product.description.toLowerCase().includes(searchQuery)
      );
    }
    
    set({ 
      filteredProducts: filtered,
      currentSearchQuery: query
    });
  },
  
  getUniqueCompanies: () => {
    const { products } = get();
    const companies = Array.from(new Set(products.map(product => product.company)));
    return companies.filter(company => company && company.trim() !== '').sort();
  },
  
  addProduct: async (productData) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('products')
        .insert({
          name: productData.name,
          description: productData.description,
          price: productData.price,
          image_url: productData.imageUrl,
          company: productData.company,
          company_image_url: productData.companyImageUrl,
          category: productData.category,
          variations: productData.variations,
          locations: productData.locations,
          discount: productData.discount,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      const newProduct: Product = {
        id: data.id,
        name: data.name,
        description: data.description,
        price: data.price,
        imageUrl: data.image_url,
        company: data.company,
        companyImageUrl: data.company_image_url,
        category: data.category,
        variations: data.variations as any,
        locations: data.locations as Location[],
        discount: data.discount as any,
      };
      
      set(state => ({ 
        products: [newProduct, ...state.products],
        filteredProducts: [newProduct, ...state.filteredProducts],
        isLoading: false 
      }));
      
      // Reapply current filters to include the new product if it matches
      const { currentLocation, currentCompanyFilter, currentSearchQuery } = get();
      let shouldRefilter = false;
      
      if (currentLocation && !newProduct.locations.includes(currentLocation)) {
        shouldRefilter = true;
      }
      if (currentCompanyFilter && newProduct.company !== currentCompanyFilter) {
        shouldRefilter = true;
      }
      if (currentSearchQuery) {
        const query = currentSearchQuery.toLowerCase();
        if (!newProduct.name.toLowerCase().includes(query) && 
            !newProduct.description.toLowerCase().includes(query)) {
          shouldRefilter = true;
        }
      }
      
      if (shouldRefilter) {
        // Remove the new product from filtered list if it doesn't match current filters
        set(state => ({
          filteredProducts: state.filteredProducts.filter(p => p.id !== newProduct.id)
        }));
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to add product', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  updateProduct: async (updatedProduct) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('products')
        .update({
          name: updatedProduct.name,
          description: updatedProduct.description,
          price: updatedProduct.price,
          image_url: updatedProduct.imageUrl,
          company: updatedProduct.company,
          company_image_url: updatedProduct.companyImageUrl,
          category: updatedProduct.category,
          variations: updatedProduct.variations,
          locations: updatedProduct.locations,
          discount: updatedProduct.discount,
        })
        .eq('id', updatedProduct.id);
      
      if (error) throw error;
      
      set(state => ({ 
        products: state.products.map(product => 
          product.id === updatedProduct.id ? updatedProduct : product
        ),
        isLoading: false 
      }));
      
      // Reapply filters
      const { currentLocation, currentCompanyFilter, currentSearchQuery } = get();
      if (currentLocation) {
        get().filterByLocation(currentLocation);
      }
      if (currentCompanyFilter) {
        get().filterByCompany(currentCompanyFilter);
      }
      if (currentSearchQuery) {
        get().filterBySearch(currentSearchQuery);
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update product', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  deleteProduct: async (productId) => {
    set({ isLoading: true, error: null });
    try {
      console.log('Attempting to delete product:', productId);
      
      const { error, data } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)
        .select();
      
      console.log('Delete result:', { error, data });
      
      if (error) {
        console.error('Delete error:', error);
        throw error;
      }
      
      console.log('Product deleted successfully');
      
      set(state => ({ 
        products: state.products.filter(product => product.id !== productId),
        filteredProducts: state.filteredProducts.filter(product => product.id !== productId),
        isLoading: false 
      }));
      
      console.log('State updated after delete');
    } catch (error) {
      console.error('Delete product failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete product';
      set({ 
        error: errorMessage, 
        isLoading: false 
      });
      throw error;
    }
  },
  
  subscribeToProducts: () => {
    console.log('Setting up real-time subscription for products...');
    
    const subscription = supabase
      .channel('products-realtime')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'products' 
        }, 
        (payload) => {
          console.log('Product change detected:', payload);
          // Refetch products when there's a change
          get().fetchProducts();
        }
      )
      .subscribe((status) => {
        console.log('Products realtime subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to product real-time updates');
        }
      });
    
    return () => {
      console.log('Unsubscribing from product real-time updates');
      supabase.removeChannel(subscription);
    };
  }
}));
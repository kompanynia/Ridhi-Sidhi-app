import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, ActivityIndicator, Pressable, ScrollView, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProductCard } from '@/components/ProductCard';
import { CompanyCard } from '@/components/CompanyCard';
import { SearchBar } from '@/components/SearchBar';
import { colors } from '@/constants/colors';
import { useProductStore } from '@/stores/productStore';
import { useAuthStore } from '@/stores/authStore';
import { useTrendingStore } from '@/stores/trendingStore';
import { trpc, isBackendConfigured } from '@/lib/trpc';
import { Product, calculateDiscountedPrice, getDiscountAmount } from '@/types';
import { ArrowLeft, TrendingUp, X, FileDown } from 'lucide-react-native';

export default function HomeScreen() {
  const { user } = useAuthStore();
  const { 
    fetchProducts, 
    filterByLocation, 
    filterByCompany, 
    filterBySearch,
    filteredProducts, 
    products,
    isLoading,
  } = useProductStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [showProducts, setShowProducts] = useState(false);
  const [showTrendingBanner, setShowTrendingBanner] = useState(true);
  const { trendingProductIds, loadTrendingProducts } = useTrendingStore();
  
  // Try to use tRPC if backend is configured, with fallback to zustand store
  const trendingQuery = isBackendConfigured() ? trpc.trending.get.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false
  }) : { data: null, isLoading: false, error: null };
  
  // Use tRPC data if available and successful, otherwise fall back to local state
  const trendingProducts = (trendingQuery.data && !trendingQuery.error) 
    ? trendingQuery.data 
    : products.filter(p => trendingProductIds.includes(p.id));

  useEffect(() => {
    fetchProducts();
    loadTrendingProducts();
  }, []);

  useEffect(() => {
    if (user?.location) {
      console.log('Setting location filter:', user.location);
      filterByLocation(user.location);
    }
  }, [user?.location, filterByLocation]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (showProducts) {
      filterBySearch(query);
    }
  };

  const handleCompanySelect = (company: string) => {
    console.log('Selecting company:', company, 'User location:', user?.location);
    setSelectedCompany(company);
    setShowProducts(true);
    // Apply both location and company filters together
    filterByCompany(company);
    setSearchQuery('');
  };

  const handleBackToCompanies = () => {
    setShowProducts(false);
    setSelectedCompany(null);
    setSearchQuery('');
    filterByCompany(null);
  };

  const handleDownloadCompanyPDF = async () => {
    if (!selectedCompany) return;
    
    try {
      // Get products for the selected company (already filtered by location)
      const companyProducts = filteredProducts;
      
      if (companyProducts.length === 0) {
        Alert.alert('No Products', 'No products available for this company in your location.');
        return;
      }
      
      // Generate PDF HTML content
      const generateCompanyProductsPDF = () => {
        const productsHTML = companyProducts.map(product => {
          const variationsHTML = product.variations.map(variation => {
            const activeDiscount = product.discount;
            const originalPrice = variation.price;
            const discountedPrice = activeDiscount ? calculateDiscountedPrice(originalPrice, activeDiscount) : originalPrice;
            const discountAmount = activeDiscount ? getDiscountAmount(originalPrice, activeDiscount) : 0;
            
            return `
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;">
                <div style="font-weight: bold;">${product.name}</div>
                <div style="font-size: 12px; color: #666;">${product.description}</div>
                ${activeDiscount ? `<div style="font-size: 11px; color: #e74c3c; margin-top: 4px;">
                  ${activeDiscount.type === 'percentage' ? `${activeDiscount.value}% OFF` : `₹${activeDiscount.value} OFF`}
                </div>` : ''}
              </td>
              <td style="padding: 8px; border: 1px solid #ddd;">
                <img src="${variation.imageUrl || product.imageUrl}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;" />
              </td>
              <td style="padding: 8px; border: 1px solid #ddd;">${variation.size} - ${variation.variety}</td>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">
                ${activeDiscount ? `
                  <div style="text-decoration: line-through; color: #999; font-size: 12px;">₹${originalPrice.toFixed(2)}</div>
                  <div style="color: #e74c3c; font-weight: bold;">₹${discountedPrice.toFixed(2)}</div>
                  <div style="font-size: 10px; color: #27ae60;">Save ₹${discountAmount.toFixed(2)}</div>
                ` : `₹${originalPrice.toFixed(2)}`}
              </td>
            </tr>
          `;
          }).join('');
          return variationsHTML;
        }).join('');
        
        return `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>${selectedCompany} - Product Catalog</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
              .header { text-align: center; margin-bottom: 30px; }
              .company-name { font-size: 24px; font-weight: bold; color: #4A6FA5; margin-bottom: 10px; }
              .date { font-size: 14px; color: #666; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th { background-color: #f2f2f2; padding: 12px; border: 1px solid #ddd; text-align: left; }
              td { padding: 8px; border: 1px solid #ddd; vertical-align: top; }
              .footer { margin-top: 30px; text-align: center; color: #777; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="company-name">${selectedCompany}</div>
              <div class="date">Product Catalog - ${new Date().toLocaleDateString()}</div>
              <div style="font-size: 14px; color: #666; margin-top: 5px;">Location: ${user?.location || 'All Locations'}</div>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Product Details</th>
                  <th>Image</th>
                  <th>Size & Variety</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                ${productsHTML}
              </tbody>
            </table>
            
            <div class="footer">
              <p>Total Products: ${companyProducts.length}</p>
              <p>Generated on ${new Date().toLocaleString()}</p>
            </div>
          </body>
          </html>
        `;
      };
      
      const html = generateCompanyProductsPDF();
      
      if (Platform.OS === 'web') {
        // For web, open in new window for printing
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          printWindow.focus();
          printWindow.print();
        }
      } else {
        // For mobile, use expo-print
        const Print = require('expo-print');
        const Sharing = require('expo-sharing');
        
        const { uri } = await Print.printToFileAsync({
          html,
          base64: false,
        });
        
        const fileName = `${selectedCompany}_Products_${new Date().toLocaleDateString('en-IN').replace(/\//g, '-')}.pdf`;
        
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Download Company Products PDF',
            UTI: 'com.adobe.pdf',
          });
        }
      }
      
    } catch (error) {
      console.error('PDF generation error:', error);
      Alert.alert('Error', 'Failed to generate PDF. Please try again.');
    }
  };

  // Get unique companies with their images and product counts
  const getCompaniesData = () => {
    const locationFilteredProducts = user?.location 
      ? products.filter(product => product.locations.includes(user.location!))
      : products;
    
    const companiesMap = new Map();
    
    locationFilteredProducts.forEach(product => {
      if (!companiesMap.has(product.company)) {
        companiesMap.set(product.company, {
          name: product.company,
          imageUrl: product.companyImageUrl || product.imageUrl,
          productCount: 0
        });
      }
      companiesMap.get(product.company).productCount++;
    });
    
    return Array.from(companiesMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  };

  const companiesData = getCompaniesData();
  
  // Filter companies by search query
  const filteredCompanies = searchQuery && !showProducts
    ? companiesData.filter(company => 
        company.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : companiesData;

  // Get trending products for display from database
  const trendingProductsForDisplay = trendingProducts.slice(0, 3);

  const renderProductItem = ({ item }: { item: Product }) => (
    <ProductCard product={item} />
  );

  const renderCompanyItem = ({ item }: { item: any }) => (
    <CompanyCard 
      company={item.name}
      imageUrl={item.imageUrl}
      productCount={item.productCount}
      onPress={() => handleCompanySelect(item.name)}
    />
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        {showProducts 
          ? (searchQuery 
              ? 'No products match your search' 
              : `No products available from ${selectedCompany}`)
          : (searchQuery 
              ? 'No companies match your search'
              : 'No companies available in your location')}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {showProducts && (
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={handleBackToCompanies}>
            <ArrowLeft size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>{selectedCompany}</Text>
          <Pressable style={styles.pdfButton} onPress={handleDownloadCompanyPDF}>
            <FileDown size={20} color={colors.primary} />
          </Pressable>
        </View>
      )}
      
      {/* Trending Products Banner */}
      {!showProducts && showTrendingBanner && trendingProductsForDisplay.length > 0 && (
        <View style={styles.trendingBanner}>
          <View style={styles.trendingHeader}>
            <View style={styles.trendingTitleContainer}>
              <TrendingUp size={20} color={colors.primary} />
              <Text style={styles.trendingTitle}>Trending Products</Text>
            </View>
            <Pressable 
              onPress={() => setShowTrendingBanner(false)}
              style={styles.closeBanner}
            >
              <X size={18} color={colors.textLight} />
            </Pressable>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.trendingScroll}
          >
            {trendingProductsForDisplay.map((product) => (
              <View key={product.id} style={styles.trendingProductCard}>
                <ProductCard product={product} compact />
              </View>
            ))}
          </ScrollView>
        </View>
      )}
      
      <SearchBar
        value={searchQuery}
        onChangeText={handleSearch}
        placeholder={showProducts ? 'Search products...' : 'Search companies...'}
      />
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={showProducts ? filteredProducts : filteredCompanies}
          renderItem={showProducts ? renderProductItem : renderCompanyItem}
          keyExtractor={(item) => showProducts ? item.id : item.name}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyList}
        />
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  pdfButton: {
    padding: 8,
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 8,
    paddingBottom: 24,
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
  trendingBanner: {
    backgroundColor: colors.white,
    marginHorizontal: 8,
    marginVertical: 8,
    borderRadius: 12,
    padding: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  trendingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  trendingTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trendingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  closeBanner: {
    padding: 4,
  },
  trendingScroll: {
    paddingHorizontal: 4,
  },
  trendingProductCard: {
    width: 140,
    marginRight: 12,
  },
});
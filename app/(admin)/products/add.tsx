import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Switch, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AntDesign } from '@expo/vector-icons';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { CompanyPicker } from '@/components/CompanyPicker';
// import { ImageUpload } from '@/components/ImageUpload';
import { colors } from '@/constants/colors';
import { useProductStore } from '@/stores/productStore';
import { Product, ProductVariation, Location, Discount, DiscountType } from '@/types';

interface VariationMatrix {
  [sizeVarietyKey: string]: {
    price: string;
    description: string;
    imageUrl: string;
    udaipur: boolean;
    mungana: boolean;
  };
}

export default function AddProductScreen() {
  const router = useRouter();
  const { addProduct } = useProductStore();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [company, setCompany] = useState('');
  const [companyImageUrl, setCompanyImageUrl] = useState('');
  const [category, setCategory] = useState('');
  
  // Product-level discount
  const [productDiscountType, setProductDiscountType] = useState<DiscountType>('percentage');
  const [productDiscountValue, setProductDiscountValue] = useState('');
  
  // Size and Variety options
  const [sizes, setSizes] = useState<string[]>(['Small']);
  const [varieties, setVarieties] = useState<string[]>(['Standard']);
  const [newSize, setNewSize] = useState('');
  const [newVariety, setNewVariety] = useState('');
  
  // Variation matrix for Size × Variety combinations
  const [variationMatrix, setVariationMatrix] = useState<VariationMatrix>({
    'Small-Standard': {
      price: '',
      description: '',
      imageUrl: '',
      udaipur: true,
      mungana: true,
    }
  });
  
  const [isAvailableInUdaipur, setIsAvailableInUdaipur] = useState(true);
  const [isAvailableInMungana, setIsAvailableInMungana] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const getMatrixKey = (size: string, variety: string) => `${size}-${variety}`;

  const handleAddSize = () => {
    if (newSize.trim() && !sizes.includes(newSize.trim())) {
      const updatedSizes = [...sizes, newSize.trim()];
      setSizes(updatedSizes);
      
      // Add new combinations to matrix
      const updatedMatrix = { ...variationMatrix };
      varieties.forEach(variety => {
        const key = getMatrixKey(newSize.trim(), variety);
        if (!updatedMatrix[key]) {
          updatedMatrix[key] = {
            price: '',
            description: '',
            imageUrl: '',
            udaipur: true,
            mungana: true,
          };
        }
      });
      setVariationMatrix(updatedMatrix);
      setNewSize('');
    }
  };

  const handleAddVariety = () => {
    if (newVariety.trim() && !varieties.includes(newVariety.trim())) {
      const updatedVarieties = [...varieties, newVariety.trim()];
      setVarieties(updatedVarieties);
      
      // Add new combinations to matrix
      const updatedMatrix = { ...variationMatrix };
      sizes.forEach(size => {
        const key = getMatrixKey(size, newVariety.trim());
        if (!updatedMatrix[key]) {
          updatedMatrix[key] = {
            price: '',
            description: '',
            imageUrl: '',
            udaipur: true,
            mungana: true,
          };
        }
      });
      setVariationMatrix(updatedMatrix);
      setNewVariety('');
    }
  };

  const handleRemoveSize = (sizeToRemove: string) => {
    if (sizes.length > 1) {
      const updatedSizes = sizes.filter(size => size !== sizeToRemove);
      setSizes(updatedSizes);
      
      // Remove combinations from matrix
      const updatedMatrix = { ...variationMatrix };
      varieties.forEach(variety => {
        const key = getMatrixKey(sizeToRemove, variety);
        delete updatedMatrix[key];
      });
      setVariationMatrix(updatedMatrix);
    }
  };

  const handleRemoveVariety = (varietyToRemove: string) => {
    if (varieties.length > 1) {
      const updatedVarieties = varieties.filter(variety => variety !== varietyToRemove);
      setVarieties(updatedVarieties);
      
      // Remove combinations from matrix
      const updatedMatrix = { ...variationMatrix };
      sizes.forEach(size => {
        const key = getMatrixKey(size, varietyToRemove);
        delete updatedMatrix[key];
      });
      setVariationMatrix(updatedMatrix);
    }
  };

  const handleMatrixChange = (size: string, variety: string, field: string, value: string | boolean) => {
    const key = getMatrixKey(size, variety);
    setVariationMatrix(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  const validateForm = () => {
    const missingFields = [];
    if (!name) missingFields.push('Product Name');
    if (!description) missingFields.push('Description');
    if (!price) missingFields.push('Base Price');
    if (!imageUrl) missingFields.push('Product Image');
    if (!company) missingFields.push('Company');
    if (!companyImageUrl) missingFields.push('Company Image');
    if (!category) missingFields.push('Category');
    
    if (missingFields.length > 0) {
      setError(`Please fill in the following required fields: ${missingFields.join(', ')}`);
      return false;
    }
    
    if (isNaN(Number(price)) || Number(price) <= 0) {
      setError('Price must be a valid number greater than 0');
      return false;
    }
    
    if (!isAvailableInUdaipur && !isAvailableInMungana) {
      setError('Product must be available in at least one location');
      return false;
    }
    
    // Validate product-level discount
    if (productDiscountValue && (isNaN(Number(productDiscountValue)) || Number(productDiscountValue) < 0)) {
      setError('Product discount must be a valid number');
      return false;
    }
    
    if (productDiscountValue && productDiscountType === 'percentage' && Number(productDiscountValue) > 100) {
      setError('Percentage discount cannot exceed 100%');
      return false;
    }
    
    // Validate variation matrix
    for (const size of sizes) {
      for (const variety of varieties) {
        const key = getMatrixKey(size, variety);
        const variation = variationMatrix[key];
        
        if (!variation) {
          setError(`Missing variation data for ${size} - ${variety}. Please refresh and try again.`);
          return false;
        }
        
        if (!variation.price || isNaN(Number(variation.price)) || Number(variation.price) <= 0) {
          setError(`Please set a valid price for ${size} - ${variety}`);
          return false;
        }
        
        if (!variation.udaipur && !variation.mungana) {
          setError(`${size} - ${variety} must be available in at least one location`);
          return false;
        }
      }
    }
    
    return true;
  };

  const handleSubmit = async () => {
    console.log('Starting product submission...');
    
    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      console.log('Form validation passed, creating product...');
      const locations: Location[] = [];
      if (isAvailableInUdaipur) locations.push('Udaipur');
      if (isAvailableInMungana) locations.push('Mungana');
      
      // Build product-level discount
      const productDiscount: Discount | undefined = productDiscountValue && Number(productDiscountValue) > 0 ? {
        type: productDiscountType,
        value: Number(productDiscountValue)
      } : undefined;
      
      // Build variations from matrix
      const variations: ProductVariation[] = [];
      for (const size of sizes) {
        for (const variety of varieties) {
          const key = getMatrixKey(size, variety);
          const matrixItem = variationMatrix[key];
          
          const availableLocations: Location[] = [];
          if (matrixItem.udaipur) availableLocations.push('Udaipur');
          if (matrixItem.mungana) availableLocations.push('Mungana');
          
          variations.push({
            id: Math.random().toString(),
            size,
            variety,
            price: Number(matrixItem.price),
            description: matrixItem.description || undefined,
            imageUrl: matrixItem.imageUrl || undefined,
            availableLocations,
          });
        }
      }
      
      const newProduct: Omit<Product, 'id'> = {
        name,
        description,
        price: Number(price),
        imageUrl,
        company,
        companyImageUrl,
        category,
        variations,
        locations,
        discount: productDiscount,
      };
      
      console.log('Calling addProduct with:', newProduct);
      await addProduct(newProduct);
      console.log('Product added successfully');
      Alert.alert('Success', 'Product added successfully');
      router.back();
    } catch (err) {
      console.error('Error adding product:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to add product. Please try again.';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Add Product',
          headerLeft: () => (
            <AntDesign name="plus" size={24} color={colors.primary} style={{ marginLeft: 8 }} />
          ),
        }} 
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Add New Product</Text>
          
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
          
          <Input
            label="Product Name *"
            placeholder="Enter product name"
            value={name}
            onChangeText={setName}
          />
          
          <Input
            label="Description *"
            placeholder="Enter product description"
            value={description}
            onChangeText={setDescription}
            multiline
          />
          
          <Input
            label="Base Price (₹) *"
            placeholder="Enter base reference price"
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
          />
          
          <Input
            label="Product Image URL *"
            placeholder="Enter image URL (e.g., https://example.com/image.jpg)"
            value={imageUrl}
            onChangeText={setImageUrl}
          />
          
          <CompanyPicker
            label="Company *"
            value={company}
            onValueChange={setCompany}
            onCompanyImageChange={setCompanyImageUrl}
            placeholder="Select or create company"
          />
          
          <Input
            label="Company Image URL *"
            placeholder="Enter company image URL"
            value={companyImageUrl}
            onChangeText={setCompanyImageUrl}
          />
          
          <Input
            label="Category *"
            placeholder="Enter product category"
            value={category}
            onChangeText={setCategory}
          />
          
          {/* Product-level Discount */}
          <Text style={styles.sectionTitle}>Product Discount (Optional)</Text>
          <View style={styles.discountContainer}>
            <View style={styles.discountTypeContainer}>
              <Text style={styles.discountLabel}>Discount Type:</Text>
              <View style={styles.discountTypeButtons}>
                <Button
                  title="Percentage"
                  variant={productDiscountType === 'percentage' ? 'primary' : 'outline'}
                  size="small"
                  onPress={() => setProductDiscountType('percentage')}
                  style={styles.discountTypeButton}
                />
                <Button
                  title="Flat Amount"
                  variant={productDiscountType === 'flat' ? 'primary' : 'outline'}
                  size="small"
                  onPress={() => setProductDiscountType('flat')}
                  style={styles.discountTypeButton}
                />
              </View>
            </View>
            
            <Input
              label={`Discount Value ${productDiscountType === 'percentage' ? '(%)' : '(₹)'}`}
              placeholder={productDiscountType === 'percentage' ? 'Enter percentage (0-100)' : 'Enter amount in rupees'}
              value={productDiscountValue}
              onChangeText={setProductDiscountValue}
              keyboardType="numeric"
            />
          </View>
          
          {/* Size Management */}
          <Text style={styles.sectionTitle}>Size Options</Text>
          <View style={styles.optionsList}>
            {sizes.map((size, index) => (
              <View key={size} style={styles.optionItem}>
                <Text style={styles.optionText}>{size}</Text>
                {sizes.length > 1 && (
                  <Button
                    title="Remove"
                    onPress={() => handleRemoveSize(size)}
                    variant="outline"
                    size="small"
                  />
                )}
              </View>
            ))}
          </View>
          
          <View style={styles.addOptionContainer}>
            <Input
              placeholder="Add new size (e.g., Medium, Large)"
              value={newSize}
              onChangeText={setNewSize}
              containerStyle={styles.addOptionInput}
            />
            <Button
              title="Add Size"
              onPress={handleAddSize}
              variant="outline"
              size="small"
            />
          </View>
          
          {/* Variety Management */}
          <Text style={styles.sectionTitle}>Variety Options</Text>
          <View style={styles.optionsList}>
            {varieties.map((variety, index) => (
              <View key={variety} style={styles.optionItem}>
                <Text style={styles.optionText}>{variety}</Text>
                {varieties.length > 1 && (
                  <Button
                    title="Remove"
                    onPress={() => handleRemoveVariety(variety)}
                    variant="outline"
                    size="small"
                  />
                )}
              </View>
            ))}
          </View>
          
          <View style={styles.addOptionContainer}>
            <Input
              placeholder="Add new variety (e.g., Gold, Silver)"
              value={newVariety}
              onChangeText={setNewVariety}
              containerStyle={styles.addOptionInput}
            />
            <Button
              title="Add Variety"
              onPress={handleAddVariety}
              variant="outline"
              size="small"
            />
          </View>
          
          {/* Variation Matrix */}
          <Text style={styles.sectionTitle}>Size × Variety Combinations</Text>
          {sizes.map(size => (
            <View key={size} style={styles.sizeSection}>
              <Text style={styles.sizeTitle}>{size}</Text>
              {varieties.map(variety => {
                const key = getMatrixKey(size, variety);
                const matrixItem = variationMatrix[key];
                
                return (
                  <View key={key} style={styles.variationCard}>
                    <Text style={styles.variationTitle}>{variety}</Text>
                    
                    <Input
                      label="Price (₹) *"
                      placeholder="Enter price for this combination"
                      value={matrixItem.price}
                      onChangeText={(value) => handleMatrixChange(size, variety, 'price', value)}
                      keyboardType="numeric"
                      containerStyle={styles.matrixInput}
                    />
                    
                    <Input
                      label="Description (Optional)"
                      placeholder="Specific description for this combination"
                      value={matrixItem.description}
                      onChangeText={(value) => handleMatrixChange(size, variety, 'description', value)}
                      containerStyle={styles.matrixInput}
                    />
                    
                    <Input
                      label={`Image URL for ${size} - ${variety} (Optional)`}
                      placeholder="Enter image URL"
                      value={matrixItem.imageUrl}
                      onChangeText={(value) => handleMatrixChange(size, variety, 'imageUrl', value)}
                      containerStyle={styles.matrixInput}
                    />
                    
                    <View style={styles.locationToggles}>
                      <View style={styles.locationToggle}>
                        <Text style={styles.locationLabel}>Udaipur</Text>
                        <Switch
                          value={matrixItem.udaipur}
                          onValueChange={(value) => handleMatrixChange(size, variety, 'udaipur', value)}
                          trackColor={{ false: colors.border, true: colors.primary }}
                          thumbColor={colors.white}
                        />
                      </View>
                      
                      <View style={styles.locationToggle}>
                        <Text style={styles.locationLabel}>Mungana</Text>
                        <Switch
                          value={matrixItem.mungana}
                          onValueChange={(value) => handleMatrixChange(size, variety, 'mungana', value)}
                          trackColor={{ false: colors.border, true: colors.primary }}
                          thumbColor={colors.white}
                        />
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          ))}
          
          <Text style={styles.sectionTitle}>General Availability</Text>
          
          <View style={styles.locationContainer}>
            <Text style={styles.locationLabel}>Available in Udaipur</Text>
            <Switch
              value={isAvailableInUdaipur}
              onValueChange={setIsAvailableInUdaipur}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
          
          <View style={styles.locationContainer}>
            <Text style={styles.locationLabel}>Available in Mungana</Text>
            <Switch
              value={isAvailableInMungana}
              onValueChange={setIsAvailableInMungana}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
          
          <View style={styles.buttonContainer}>
            <Button
              title="Cancel"
              onPress={() => router.back()}
              variant="outline"
              style={styles.cancelButton}
            />
            <Button
              title="Add Product"
              onPress={handleSubmit}
              loading={isSubmitting}
              style={styles.submitButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  errorContainer: {
    backgroundColor: 'rgba(229, 115, 115, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 24,
    marginBottom: 12,
  },
  discountContainer: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  discountTypeContainer: {
    marginBottom: 12,
  },
  discountLabel: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
    fontWeight: '500',
  },
  discountTypeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  discountTypeButton: {
    flex: 1,
  },
  optionsList: {
    marginBottom: 12,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  optionText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  addOptionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  addOptionInput: {
    flex: 1,
    marginRight: 12,
  },
  sizeSection: {
    marginBottom: 20,
  },
  sizeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
    paddingLeft: 8,
  },
  variationCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  variationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  matrixInput: {
    marginBottom: 12,
  },
  locationToggles: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  locationToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  locationLabel: {
    fontSize: 14,
    color: colors.text,
    marginRight: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
    marginBottom: 40,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  submitButton: {
    flex: 1,
    marginLeft: 8,
  },
});
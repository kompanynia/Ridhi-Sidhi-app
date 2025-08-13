import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, Modal, FlatList, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { useProductStore } from '@/stores/productStore';

interface CompanyPickerProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  onCompanyImageChange?: (imageUrl: string) => void;
  placeholder?: string;
}

export const CompanyPicker: React.FC<CompanyPickerProps> = ({
  label,
  value,
  onValueChange,
  onCompanyImageChange,
  placeholder = "Select or create company",
}) => {
  const { getUniqueCompanies, products } = useProductStore();
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [companies, setCompanies] = useState<string[]>([]);

  useEffect(() => {
    const uniqueCompanies = getUniqueCompanies();
    setCompanies(uniqueCompanies);
  }, [getUniqueCompanies]);

  const filteredCompanies = companies.filter(company =>
    company.toLowerCase().includes(searchText.toLowerCase())
  );

  const showCreateOption = searchText.length > 0 && 
    !companies.some(company => company.toLowerCase() === searchText.toLowerCase());

  const handleSelectCompany = (company: string) => {
    onValueChange(company);
    
    // Auto-fetch company image if callback is provided
    if (onCompanyImageChange) {
      const existingProduct = products.find(p => p.company === company && p.companyImageUrl);
      if (existingProduct && existingProduct.companyImageUrl) {
        onCompanyImageChange(existingProduct.companyImageUrl);
      }
    }
    
    setIsOpen(false);
    setSearchText('');
  };

  const handleCreateCompany = () => {
    if (searchText.trim()) {
      onValueChange(searchText.trim());
      setIsOpen(false);
      setSearchText('');
    }
  };

  const renderCompanyItem = ({ item }: { item: string }) => (
    <Pressable
      style={[
        styles.optionItem,
        value === item && styles.selectedOption,
      ]}
      onPress={() => handleSelectCompany(item)}
    >
      <Text style={[
        styles.optionText,
        value === item && styles.selectedOptionText,
      ]}>
        {item}
      </Text>
      {value === item && (
        <Ionicons name="checkmark" size={16} color={colors.primary} />
      )}
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      
      <Pressable
        style={styles.picker}
        onPress={() => setIsOpen(true)}
      >
        <Text style={[
          styles.pickerText,
          !value && styles.placeholderText,
        ]}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color={colors.textLight} />
      </Pressable>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setIsOpen(false)}
        >
          <Pressable
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Company</Text>
              <Pressable
                style={styles.closeButton}
                onPress={() => setIsOpen(false)}
              >
                <Ionicons name="close" size={20} color={colors.textLight} />
              </Pressable>
            </View>
            
            <TextInput
              style={styles.searchInput}
              placeholder="Search or type new company name..."
              value={searchText}
              onChangeText={setSearchText}
              placeholderTextColor={colors.textLight}
            />

            <FlatList
              data={filteredCompanies}
              renderItem={renderCompanyItem}
              keyExtractor={(item) => item}
              style={styles.optionsList}
              showsVerticalScrollIndicator={false}
            />

            {showCreateOption && (
              <Pressable
                style={styles.createOption}
                onPress={handleCreateCompany}
              >
                <Ionicons name="add" size={16} color={colors.primary} />
                <Text style={styles.createOptionText}>
                  Create &quot;{searchText}&quot;
                </Text>
              </Pressable>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  pickerText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  placeholderText: {
    color: colors.textLight,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  searchInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    margin: 16,
    fontSize: 16,
    color: colors.text,
  },
  optionsList: {
    maxHeight: 200,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  selectedOption: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  optionText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  selectedOptionText: {
    color: colors.primary,
    fontWeight: '500',
  },
  createOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
  },
  createOptionText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '500',
    marginLeft: 8,
  },
});
import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable } from 'react-native';
import { colors } from '@/constants/colors';
import { useProductStore } from '@/stores/productStore';

interface CompanyFilterProps {
  selectedCompany: string | null;
  onSelectCompany: (company: string | null) => void;
}

export const CompanyFilter: React.FC<CompanyFilterProps> = ({
  selectedCompany,
  onSelectCompany,
}) => {
  const { products } = useProductStore();
  const [companies, setCompanies] = useState<string[]>([]);

  useEffect(() => {
    // Extract unique companies from products
    const uniqueCompanies = Array.from(new Set(products.map(product => product.company)));
    setCompanies(uniqueCompanies);
  }, [products]);

  const handleSelectCompany = (company: string) => {
    if (selectedCompany === company) {
      // If already selected, deselect it
      onSelectCompany(null);
    } else {
      onSelectCompany(company);
    }
  };

  if (companies.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Filter by Company</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Pressable
          style={[
            styles.chip,
            selectedCompany === null && styles.selectedChip,
          ]}
          onPress={() => onSelectCompany(null)}
        >
          <Text 
            style={[
              styles.chipText,
              selectedCompany === null && styles.selectedChipText,
            ]}
          >
            All
          </Text>
        </Pressable>
        
        {companies.map((company) => (
          <Pressable
            key={company}
            style={[
              styles.chip,
              selectedCompany === company && styles.selectedChip,
            ]}
            onPress={() => handleSelectCompany(company)}
          >
            <Text 
              style={[
                styles.chipText,
                selectedCompany === company && styles.selectedChipText,
              ]}
            >
              {company}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 16,
    marginBottom: 8,
    color: colors.text,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  selectedChipText: {
    color: colors.white,
  },
});
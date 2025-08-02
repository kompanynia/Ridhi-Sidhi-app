import React from 'react';
import { StyleSheet, View, TextInput, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search products...',
  onSubmit,
}) => {
  const handleClear = () => {
    onChangeText('');
  };

  return (
    <View style={styles.container}>
      <Ionicons name="search" size={20} color={colors.textLight} style={styles.icon} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textLight}
        returnKeyType="search"
        onSubmitEditing={onSubmit}
      />
      {value.length > 0 && (
        <Pressable onPress={handleClear} style={styles.clearButton}>
          <Ionicons name="close" size={18} color={colors.textLight} />
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    padding: 0,
  },
  clearButton: {
    padding: 4,
  },
});
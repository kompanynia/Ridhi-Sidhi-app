import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Share, Platform, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import WebView from 'react-native-webview';
import { AntDesign } from '@expo/vector-icons';
import { Button } from '@/components/Button';
import { colors } from '@/constants/colors';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { generateInvoiceHTML, generateAndDownloadPDF } from '@/utils/invoice';
import { Order } from '@/types';

export default function InvoiceScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();
  const { orders } = useCartStore();
  const { user } = useAuthStore();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [invoiceHtml, setInvoiceHtml] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (orders.length > 0 && orderId) {
      const foundOrder = orders.find(o => o.id === orderId);
      if (foundOrder) {
        setOrder(foundOrder);
        const html = generateInvoiceHTML(foundOrder);
        setInvoiceHtml(html);
      }
    }
  }, [orders, orderId]);



  const handleDownloadPDF = async () => {
    if (!order) return;
    
    setIsDownloading(true);
    try {
      await generateAndDownloadPDF(order);
      if (Platform.OS !== 'web') {
        Alert.alert('Success', 'Invoice PDF has been generated and shared!');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDone = () => {
    // Check user role and navigate accordingly
    if (user?.role === 'admin') {
      router.replace('/(admin)/orders');
    } else {
      router.replace('/(customer)/orders');
    }
  };

  if (!order) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>Invoice not found</Text>
        <Button title="Go Back" onPress={() => router.back()} style={styles.backButton} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Invoice</Text>
        <Text style={styles.subtitle}>Order #{order.id}</Text>
      </View>
      
      <View style={styles.webviewContainer}>
        {invoiceHtml ? (
          <WebView
            source={{ html: invoiceHtml }}
            style={styles.webview}
          />
        ) : (
          <Text style={styles.loadingText}>Loading invoice...</Text>
        )}
      </View>
      
      <View style={styles.footer}>
        <Button
          title={isDownloading ? "Generating..." : "Download PDF"}
          onPress={handleDownloadPDF}
          variant="outline"
          style={styles.actionButton}
          disabled={isDownloading}
          icon={<AntDesign name="download" size={16} color={isDownloading ? colors.textLight : colors.primary} />}
        />
        <Button
          title="Done"
          onPress={handleDone}
          style={styles.doneButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  errorText: {
    fontSize: 18,
    color: colors.error,
    marginBottom: 16,
  },
  backButton: {
    marginTop: 16,
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
    fontSize: 16,
    color: colors.textLight,
    marginTop: 4,
  },
  webviewContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  webview: {
    flex: 1,
  },
  loadingText: {
    padding: 16,
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
  },
  footer: {
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
  doneButton: {
    flex: 1,
  },
});
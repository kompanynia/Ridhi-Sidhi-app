import { Order, CartItem, calculateDiscountedPrice, getDiscountAmount } from '@/types';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

export const generateInvoiceHTML = (order: Order): string => {
  const date = new Date(order.date).toLocaleDateString();
  const time = new Date(order.date).toLocaleTimeString();
  
  let totalSavings = 0;
  let originalTotal = 0;
  
  const itemsHTML = order.items.map((item: CartItem) => {
    const variation = item.product.variations.find(v => v.id === item.variationId);
    if (!variation) return '';
    
    const activeDiscount = item.product.discount;
    const originalPrice = variation.price;
    const discountedPrice = activeDiscount ? calculateDiscountedPrice(originalPrice, activeDiscount) : originalPrice;
    const discountAmount = activeDiscount ? getDiscountAmount(originalPrice, activeDiscount) : 0;
    
    const itemOriginalTotal = originalPrice * item.quantity;
    const itemDiscountedTotal = discountedPrice * item.quantity;
    const itemSavings = discountAmount * item.quantity;
    
    originalTotal += itemOriginalTotal;
    totalSavings += itemSavings;
    
    const variationInfo = `${variation.size} - ${variation.variety}`;
    
    return `
      <tr>
        <td>
          <div>${item.product.name}</div>
          <div style="font-size: 13px; color: #333; font-weight: 500;">${item.product.company}</div>
          <div style="font-size: 12px; color: #666;">${variationInfo}</div>
          ${activeDiscount ? `<div style="font-size: 11px; color: #e74c3c;">
            ${activeDiscount.type === 'percentage' ? `${activeDiscount.value}% OFF` : `₹${activeDiscount.value} OFF`}
          </div>` : ''}
        </td>
        <td>
          ${activeDiscount ? `
            <div style="text-decoration: line-through; color: #999; font-size: 12px;">₹${originalPrice.toFixed(2)}</div>
            <div style="color: #e74c3c; font-weight: bold;">₹${discountedPrice.toFixed(2)}</div>
          ` : `₹${originalPrice.toFixed(2)}`}
        </td>
        <td>${item.quantity}</td>
        <td>
          ${activeDiscount ? `
            <div style="text-decoration: line-through; color: #999; font-size: 12px;">₹${itemOriginalTotal.toFixed(2)}</div>
            <div style="color: #e74c3c; font-weight: bold;">₹${itemDiscountedTotal.toFixed(2)}</div>
          ` : `₹${itemOriginalTotal.toFixed(2)}`}
        </td>
      </tr>
    `;
  }).join('');
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          color: #333;
        }
        .invoice-box {
          max-width: 800px;
          margin: auto;
          padding: 30px;
          border: 1px solid #eee;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.15);
        }
        .invoice-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
        }
        .logo {
          max-width: 150px;
          height: auto;
          margin-right: 20px;
        }
        .invoice-title {
          font-size: 28px;
          font-weight: bold;
          color: #4A6FA5;
        }
        .invoice-details {
          margin-bottom: 30px;
        }
        .invoice-details p {
          margin: 5px 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          padding: 10px;
          border-bottom: 1px solid #ddd;
          text-align: left;
          vertical-align: top;
        }
        th {
          background-color: #f2f2f2;
        }
        .total-row {
          font-weight: bold;
        }
        .savings-row {
          color: #27ae60;
          font-weight: bold;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          color: #777;
          font-size: 12px;
        }
        .summary-section {
          margin-top: 20px;
          padding: 15px;
          background-color: #f8f9fa;
          border-radius: 5px;
        }
      </style>
    </head>
    <body>
      <div class="invoice-box">
        <div class="invoice-header">
          <div style="display: flex; align-items: center;">
            <img src="https://r2-pub.rork.com/attachments/thpnugawh5ghq7375u8mn" alt="Riddhi Siddhi Logo" class="logo" />
            <div class="invoice-title">INVOICE</div>
          </div>
          <div>
            <p><strong>Order ID:</strong> ${order.id}</p>
            <p><strong>Date:</strong> ${date}</p>
            <p><strong>Time:</strong> ${time}</p>
          </div>
        </div>
        
        <div class="invoice-details">
          ${order.userName ? `<p><strong>Customer:</strong> ${order.userName}</p>` : ''}
          ${order.userEmail ? `<p><strong>Email:</strong> ${order.userEmail}</p>` : ''}
          ${order.userPhone ? `<p><strong>Phone:</strong> ${order.userPhone}</p>` : ''}
          <p><strong>Location:</strong> ${order.location}</p>
          ${order.message ? `<p><strong>Customer Message:</strong> ${order.message}</p>` : ''}
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Price</th>
              <th>Quantity</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>
        
        ${totalSavings > 0 ? `
          <div class="summary-section">
            <table style="margin: 0;">
              <tr>
                <td colspan="3">Original Total</td>
                <td style="text-decoration: line-through; color: #999;">₹${originalTotal.toFixed(2)}</td>
              </tr>
              <tr class="savings-row">
                <td colspan="3">Total Savings</td>
                <td>-₹${totalSavings.toFixed(2)}</td>
              </tr>
              <tr class="total-row" style="border-top: 2px solid #333;">
                <td colspan="3">Final Total</td>
                <td>₹${order.totalAmount.toFixed(2)}</td>
              </tr>
            </table>
          </div>
        ` : `
          <table style="margin-top: 20px;">
            <tr class="total-row">
              <td colspan="3">Total</td>
              <td>₹${order.totalAmount.toFixed(2)}</td>
            </tr>
          </table>
        `}
        
        <div class="footer">
          <p>Thank you for your business!</p>
          ${totalSavings > 0 ? `<p style="color: #27ae60; font-weight: bold;">You saved ₹${totalSavings.toFixed(2)} on this order!</p>` : ''}
        </div>
      </div>
    </body>
    </html>
  `;
};

export const generateAndDownloadPDF = async (order: Order): Promise<void> => {
  try {
    const html = generateInvoiceHTML(order);
    
    if (Platform.OS === 'web') {
      // For web, create a downloadable PDF using print functionality
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
      }
      return;
    }
    
    // For mobile platforms
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });
    
    const fileName = `Invoice_${order.id.slice(-8)}_${new Date(order.date).toLocaleDateString('en-IN').replace(/\//g, '-')}.pdf`;
    
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Download Invoice PDF',
        UTI: 'com.adobe.pdf',
      });
    } else {
      console.log('Sharing is not available on this platform');
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};
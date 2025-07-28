export type UserRole = 'admin' | 'customer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  location?: Location;
  phone?: string;
  address?: string;
}

export type Location = 'Udaipur' | 'Mungana';

export type DiscountType = 'percentage' | 'flat';

export interface Discount {
  type: DiscountType;
  value: number; // Percentage (0-100) or flat amount
}

export interface ProductVariation {
  id: string;
  size: string;
  variety: string;
  price: number; // Full price for this combination
  description?: string;
  imageUrl?: string; // Image specific to this size-variety combination
  availableLocations: Location[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number; // Base price (can be used as reference)
  imageUrl: string;
  company: string;
  companyImageUrl?: string;
  category: string;
  variations: ProductVariation[];
  locations: Location[];
  discount?: Discount; // Product-level discount only
}

export interface CartItem {
  productId: string;
  product: Product;
  variationId: string;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  items: CartItem[];
  totalAmount: number;
  location: Location;
  date: string;
  status: 'pending' | 'completed' | 'cancelled';
  message?: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Company {
  id: string;
  name: string;
}

export interface Todo {
  id: number;
  title: string;
  completed?: boolean;
  created_at?: string;
}

// Utility function to calculate discounted price
export const calculateDiscountedPrice = (originalPrice: number, discount?: Discount): number => {
  if (!discount || discount.value <= 0) return originalPrice;
  
  if (discount.type === 'percentage') {
    return originalPrice * (1 - discount.value / 100);
  } else {
    return Math.max(0, originalPrice - discount.value);
  }
};

// Utility function to get discount amount
export const getDiscountAmount = (originalPrice: number, discount?: Discount): number => {
  if (!discount || discount.value <= 0) return 0;
  
  if (discount.type === 'percentage') {
    return originalPrice * (discount.value / 100);
  } else {
    return Math.min(originalPrice, discount.value);
  }
};
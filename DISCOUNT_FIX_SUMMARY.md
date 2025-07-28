# Discount Implementation Fix Summary

## Issue
The error "Could not find the 'discount_applied' column of 'order_items' in the schema cache" occurs when placing orders because the database schema is missing the required discount columns.

## Root Cause
The database schema update script (`/lib/database-schema-update.sql`) was created but may not have been executed in the Supabase database.

## Solution

### 1. Database Schema Fix
Run the SQL script `/lib/fix-discount-schema.sql` in your Supabase SQL Editor to ensure the required columns exist:

```sql
-- This script will:
-- 1. Add 'original_price' column to order_items table
-- 2. Add 'discount_applied' column to order_items table  
-- 3. Add 'discount' column to products table
-- 4. Create necessary indexes
-- 5. Add helpful comments
```

### 2. Code Changes Made

#### `/stores/cartStore.ts`
- Fixed discount_applied field to store JSON directly instead of stringified JSON
- Ensured only product-level discounts are used (no variation-level discounts)

#### `/app/(customer)/cart.tsx`
- Updated discount calculation to use only product-level discounts
- Removed references to `variation.discount` which no longer exists

#### `/components/CartItem.tsx`
- Added proper discount display in cart items
- Shows original price with strikethrough when discount is applied
- Uses product-level discount only

### 3. Verification Steps

1. **Run the database fix script** in Supabase SQL Editor
2. **Test order placement** - should work without the discount_applied column error
3. **Verify discount display** - discounts should show correctly in:
   - Product cards
   - Product detail pages
   - Cart items
   - Order totals

### 4. Current Discount Logic

- **Product Level**: Each product can have a discount (percentage or flat amount)
- **No Variation Level**: Individual size×variety combinations no longer have separate discounts
- **Calculation**: Discount is applied to the variation price, not the base product price
- **Storage**: Original price and applied discount are stored in order_items for audit trail

### 5. Database Schema

```sql
-- Products table
ALTER TABLE products ADD COLUMN discount JSONB DEFAULT NULL;

-- Order items table  
ALTER TABLE order_items ADD COLUMN original_price DECIMAL(10,2) DEFAULT NULL;
ALTER TABLE order_items ADD COLUMN discount_applied JSONB DEFAULT NULL;
```

### 6. Discount JSON Format

```json
{
  "type": "percentage", // or "flat"
  "value": 10 // percentage number or flat amount
}
```

## Next Steps

1. Execute `/lib/fix-discount-schema.sql` in Supabase
2. Test order placement functionality
3. Verify discount calculations are working correctly
4. Remove the old database schema update file if no longer needed
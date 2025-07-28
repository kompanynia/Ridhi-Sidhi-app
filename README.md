# PipeShop - E-commerce App

## Database Setup Instructions

To set up the Supabase database, follow these steps:

1. Go to your Supabase project dashboard: https://wedgjxouawfxinvldxki.supabase.co
2. Navigate to the SQL Editor
3. Copy and paste the entire content from `lib/database-setup.sql`
4. Run the SQL script

This will create:
- All necessary tables (users, products, orders, order_items)
- Row Level Security policies
- Triggers for automatic user creation
- Sample product data

## Admin Credentials
- Email: admin123@gmail.com
- Password: admin123

## Features
- Customer and Admin authentication
- Location-based product filtering
- Real-time order updates
- Cart management
- Order tracking
- Product management (Admin)
- User profile management

## Environment Variables
The app uses the following environment variables (already configured):
- EXPO_PUBLIC_SUPABASE_URL
- EXPO_PUBLIC_SUPABASE_ANON_KEY
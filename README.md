# PipeShop - E-commerce Mobile App

A full-featured e-commerce mobile application built with React Native, Expo, and Supabase. Features separate customer and admin interfaces with real-time order management, location-based filtering, and comprehensive product management.

## 🚀 Features

### Customer Features
- **Authentication**: Secure login/signup system
- **Location-based Shopping**: Filter products by location
- **Product Browsing**: Browse products by company with search functionality
- **Shopping Cart**: Add/remove items with quantity management
- **Order Management**: Place orders and track order history
- **Invoice Generation**: Generate and download PDF invoices
- **Profile Management**: Update personal information

### Admin Features
- **Dashboard**: Overview of orders and business metrics
- **Product Management**: Add, edit, and manage products
- **Order Management**: View and update order statuses
- **Company Management**: Manage company information and images
- **User Management**: View customer information
- **Real-time Updates**: Live order notifications

## 🛠 Tech Stack

- **Frontend**: React Native with Expo
- **Backend**: tRPC with Hono
- **Database**: Supabase (PostgreSQL)
- **State Management**: Zustand
- **Styling**: React Native StyleSheet
- **Navigation**: Expo Router
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage
- **PDF Generation**: expo-print

## 📱 Screenshots

*Add screenshots of your app here*

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/pipeshop.git
   cd pipeshop
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   EXPO_PUBLIC_RORK_API_BASE_URL=your_api_base_url
   ```

4. **Set up Supabase database**
   - Create a new Supabase project
   - Go to the SQL Editor in your Supabase dashboard
   - Run the SQL scripts in this order:
     1. `lib/database-setup.sql`
     2. `lib/database-schema-update.sql`
     3. `lib/add-order-message.sql`
     4. `lib/add-company-image.sql`
     5. `lib/add-trending-products.sql`
     6. `lib/add-invoice-snapshot.sql`

5. **Start the development server**
   ```bash
   bun run start
   ```

## 🌐 Web Deployment

To deploy the web version:

1. **Build for web**
   ```bash
   bun run start-web
   ```

2. **Deploy to Vercel/Netlify**
   - Connect your GitHub repository
   - Set build command: `expo export -p web`
   - Set output directory: `dist`
   - Add environment variables

## 📱 Mobile Deployment

### Using Expo Go (Development)
1. Install Expo Go on your mobile device
2. Scan the QR code from the development server

### Production Build
1. Configure `app.json` with your app details
2. Use EAS Build for production builds

## 🔐 Default Admin Credentials

- **Email**: admin123@gmail.com
- **Password**: admin123

## 📁 Project Structure

```
├── app/                    # Expo Router pages
│   ├── (admin)/           # Admin-only pages
│   ├── (customer)/        # Customer-only pages
│   ├── (tabs)/           # Tab navigation
│   └── _layout.tsx       # Root layout
├── backend/               # tRPC backend
│   ├── trpc/             # tRPC routes
│   └── hono.ts           # Hono server setup
├── components/            # Reusable components
├── stores/               # Zustand stores
├── lib/                  # Utilities and database
├── types/                # TypeScript types
├── constants/            # App constants
└── mocks/                # Mock data
```

## 🔄 Database Schema

The app uses the following main tables:
- `users` - User authentication and profiles
- `products` - Product catalog
- `companies` - Company information
- `orders` - Order management
- `order_items` - Order line items
- `trending_products` - Featured products

## 🚀 API Endpoints

The app uses tRPC for type-safe API communication:
- `/api/trpc/trending.*` - Trending products
- `/api/trpc/example.*` - Example routes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Known Issues

- Invoice generation may occasionally not display all items (working on fix)
- Real-time order updates may have slight delays

## 📞 Support

For support, email your-email@example.com or create an issue in this repository.

## 🙏 Acknowledgments

- Built with [Expo](https://expo.dev/)
- Database powered by [Supabase](https://supabase.com/)
- Icons from [@expo/vector-icons](https://docs.expo.dev/guides/icons/)
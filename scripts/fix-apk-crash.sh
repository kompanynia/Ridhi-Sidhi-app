#!/bin/bash

echo "🔧 Fixing APK Crash Issues..."

# Step 1: Create babel.config.js if it doesn't exist
if [ ! -f "babel.config.js" ]; then
    echo "📝 Creating babel.config.js..."
    cat > babel.config.js << 'EOF'
module.exports = {
  presets: ['babel-preset-expo'],
  plugins: [
    'react-native-reanimated/plugin', // Must be last if using Reanimated
  ],
};
EOF
    echo "✅ babel.config.js created"
else
    echo "✅ babel.config.js already exists"
fi

# Step 2: Clean all caches
echo "🧹 Cleaning caches..."
rm -rf node_modules
npm cache clean --force

# Step 3: Reinstall dependencies
echo "📦 Reinstalling dependencies..."
npm install

# Step 4: Install critical dependencies
echo "🔧 Installing critical dependencies..."
npx expo install react-native-gesture-handler react-native-screens react-native-safe-area-context

# Step 5: Clear Expo cache
echo "🧹 Clearing Expo cache..."
npx expo start --clear &
sleep 5
pkill -f "expo start"

echo "✅ APK crash fixes applied!"
echo ""
echo "🚀 Next steps:"
echo "1. Run: eas build --profile development --platform android"
echo "2. Test the development APK"
echo "3. If working, run: eas build --profile preview --platform android"
echo ""
echo "📱 For debugging, use: adb logcat \"*:S\" ReactNative:V ReactNativeJS:V"
# APK Crash Diagnosis and Fix Guide

## What We've Implemented

### 1. Error Handling System
- **Error Handler**: `utils/errorHandler.ts` - Captures crashes and saves logs
- **Crash Reporter**: `components/CrashReporter.tsx` - Shows crash info on next app start
- **Integration**: Added to `app/_layout.tsx` for production builds

### 2. Build Configuration
- **EAS Config**: Updated for better APK builds with cache and environment settings
- **Entry Point**: Using expo-router/entry (standard for Expo Router)
- **Dependencies**: All required packages are installed

## Troubleshooting Steps

### Step 1: Build Debug APK First
```bash
# Clear everything
rm -rf node_modules .expo
bun install

# Build debug APK to test
eas build --profile development --platform android --clear-cache
```

### Step 2: Test with Development Client
```bash
# Install development client on device
# Then run:
bun start --tunnel
# Scan QR code with development client
```

### Step 3: Check Crash Logs
After installing the APK:
1. Open the app (it may crash)
2. Open it again - if crash reporter shows, you'll see the error
3. Check console logs for crash details

### Step 4: ADB Debugging (Advanced)
```bash
# Connect device via USB with USB debugging enabled
adb logcat "*:S" ReactNative:V ReactNativeJS:V

# Install and run APK while monitoring logs
```

## Common Crash Causes & Fixes

### 1. Environment Variables Missing
**Symptom**: App crashes immediately on startup
**Fix**: Ensure `.env` file has all required variables:
```
EXPO_PUBLIC_SUPABASE_URL=your_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key
EXPO_PUBLIC_RORK_API_BASE_URL=your_api_url
```

### 2. Native Module Issues
**Symptom**: Crashes when using camera, file system, etc.
**Fix**: Check if all native modules are compatible with Expo Go v53

### 3. JavaScript Bundle Issues
**Symptom**: White screen or immediate crash
**Fix**: 
- Clear Metro cache: `npx expo start --clear`
- Check for syntax errors in TypeScript files
- Ensure all imports are correct

### 4. Memory Issues
**Symptom**: App crashes after some usage
**Fix**: 
- Optimize image sizes
- Use lazy loading for large lists
- Clear unused state/cache

## Build Commands

### For Testing
```bash
# Development build (recommended for testing)
eas build --profile development --platform android

# Preview build (production-like)
eas build --profile preview --platform android
```

### For Production
```bash
# Production build
eas build --profile production --platform android
```

## Next Steps

1. **Build development APK first** - This includes debugging tools
2. **Test on physical device** - Emulators may not show all issues
3. **Check crash logs** - Use the implemented crash reporter
4. **Use ADB if needed** - For detailed native crash logs
5. **Iterate and fix** - Address issues one by one

## Files Modified
- `utils/errorHandler.ts` - Error capture system
- `components/CrashReporter.tsx` - Crash display component  
- `app/_layout.tsx` - Integrated error handling
- `eas.json` - Optimized build configuration

The error handling system will help identify the exact cause of crashes in your APK builds.
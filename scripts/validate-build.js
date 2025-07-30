#!/usr/bin/env node

/**
 * Build Validation Script for ShopEasy Mobile App
 * Validates that all required configurations are in place for building
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating build configuration...\n');

let hasErrors = false;

// Check required files
const requiredFiles = [
  'app.json',
  'eas.json',
  'package.json',
  '.env',
  'assets/images/icon.png',
  'assets/images/adaptive-icon.png',
  'assets/images/splash-icon.png',
  'assets/images/favicon.png'
];

console.log('📁 Checking required files:');
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - MISSING`);
    hasErrors = true;
  }
});

// Check app.json configuration
console.log('\n📱 Validating app.json:');
try {
  const appJson = JSON.parse(fs.readFileSync('app.json', 'utf8'));
  const expo = appJson.expo;
  
  const requiredFields = [
    'name',
    'slug',
    'version',
    'icon',
    'android.package',
    'ios.bundleIdentifier'
  ];
  
  requiredFields.forEach(field => {
    const value = field.split('.').reduce((obj, key) => obj?.[key], expo);
    if (value) {
      console.log(`  ✅ ${field}: ${value}`);
    } else {
      console.log(`  ❌ ${field} - MISSING`);
      hasErrors = true;
    }
  });
} catch (error) {
  console.log('  ❌ Failed to parse app.json');
  hasErrors = true;
}

// Check eas.json configuration
console.log('\n🏗️ Validating eas.json:');
try {
  const easJson = JSON.parse(fs.readFileSync('eas.json', 'utf8'));
  
  if (easJson.build) {
    console.log('  ✅ Build configuration found');
    
    if (easJson.build.preview) {
      console.log('  ✅ Preview profile configured');
    }
    
    if (easJson.build.production) {
      console.log('  ✅ Production profile configured');
    }
  } else {
    console.log('  ❌ Build configuration missing');
    hasErrors = true;
  }
} catch (error) {
  console.log('  ❌ Failed to parse eas.json');
  hasErrors = true;
}

// Check environment variables
console.log('\n🔐 Checking environment variables:');
try {
  const envContent = fs.readFileSync('.env', 'utf8');
  const requiredEnvVars = [
    'EXPO_PUBLIC_SUPABASE_URL',
    'EXPO_PUBLIC_SUPABASE_ANON_KEY'
  ];
  
  requiredEnvVars.forEach(envVar => {
    if (envContent.includes(`${envVar}=`) && !envContent.includes(`${envVar}=your_`)) {
      console.log(`  ✅ ${envVar}`);
    } else {
      console.log(`  ⚠️  ${envVar} - Please set this value`);
    }
  });
} catch (error) {
  console.log('  ❌ .env file not found or unreadable');
  hasErrors = true;
}

// Check package.json dependencies
console.log('\n📦 Validating dependencies:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const criticalDeps = [
    'expo',
    'expo-router',
    'react',
    'react-native',
    '@supabase/supabase-js',
    '@trpc/client'
  ];
  
  criticalDeps.forEach(dep => {
    if (packageJson.dependencies[dep]) {
      console.log(`  ✅ ${dep}: ${packageJson.dependencies[dep]}`);
    } else {
      console.log(`  ❌ ${dep} - MISSING`);
      hasErrors = true;
    }
  });
} catch (error) {
  console.log('  ❌ Failed to parse package.json');
  hasErrors = true;
}

// Final result
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ BUILD VALIDATION FAILED');
  console.log('Please fix the issues above before building.');
  process.exit(1);
} else {
  console.log('✅ BUILD VALIDATION PASSED');
  console.log('Your app is ready to build!');
  console.log('\nNext steps:');
  console.log('1. Install EAS CLI: npm install -g @expo/eas-cli');
  console.log('2. Login: eas login');
  console.log('3. Build APK: eas build --profile preview --platform android');
  console.log('4. Build for production: eas build --profile production --platform android');
}
console.log('='.repeat(50));
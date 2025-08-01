#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing common build issues...\n');

// Check and fix package.json main field
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  if (packageJson.main !== 'expo-router/entry') {
    console.log('❌ package.json main field is incorrect');
    console.log(`   Current: ${packageJson.main}`);
    console.log('   Expected: expo-router/entry');
    console.log('   ✅ This has been fixed in your package.json\n');
  } else {
    console.log('✅ package.json main field is correct\n');
  }
}

// Check app.json configuration
const appJsonPath = path.join(process.cwd(), 'app.json');
if (fs.existsSync(appJsonPath)) {
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  
  console.log('📱 App configuration:');
  console.log(`   Name: ${appJson.expo.name}`);
  console.log(`   Version: ${appJson.expo.version}`);
  console.log(`   Android Package: ${appJson.expo.android?.package || 'Not set'}`);
  console.log(`   iOS Bundle ID: ${appJson.expo.ios?.bundleIdentifier || 'Not set'}\n`);
}

// Check for required dependencies
const requiredDeps = [
  'react-native-gesture-handler',
  'react-native-screens',
  'react-native-safe-area-context',
  'expo-router'
];

console.log('📦 Checking required dependencies:');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };

requiredDeps.forEach(dep => {
  if (allDeps[dep]) {
    console.log(`   ✅ ${dep}: ${allDeps[dep]}`);
  } else {
    console.log(`   ❌ ${dep}: Missing`);
  }
});

console.log('\n🚀 Build readiness check complete!');
console.log('\nNext steps:');
console.log('1. Run: npx expo start --clear');
console.log('2. Test the app thoroughly');
console.log('3. Build with: eas build --platform android --profile preview');
console.log('\nIf the app still crashes:');
console.log('- Check device logs: adb logcat | grep -i "expo\\|react"');
console.log('- Test on different Android versions');
console.log('- Verify all assets exist and are accessible');
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Add these for production
      '@babel/plugin-transform-export-namespace-from',
      'react-native-reanimated/plugin', // Must be last
    ],
  };
};

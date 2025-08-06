module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Change this line:
      // 'react-native-reanimated/plugin',
      // To this:
      'react-native-worklets/plugin',
    ],
  };
};

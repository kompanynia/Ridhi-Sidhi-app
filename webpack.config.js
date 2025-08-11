const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);
  
  // Fix for import.meta issue
  config.module.rules.push({
    test: /\.m?js/,
    resolve: {
      fullySpecified: false
    }
  });

  // Ensure proper module handling
  config.output = {
    ...config.output,
    scriptType: 'text/javascript'
  };

  return config;
};

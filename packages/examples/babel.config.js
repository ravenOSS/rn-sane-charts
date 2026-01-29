module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Required by react-native-reanimated. Must be listed last.
      'react-native-reanimated/plugin',
    ],
  };
};

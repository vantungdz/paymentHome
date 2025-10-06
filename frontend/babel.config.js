module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
          alias: {
            '@': './',
            '@components': './components',
            '@services': './services',
            '@contexts': './contexts',
            '@assets': './assets',
            '@app': './app',
          },
        },
      ],
      require.resolve('expo-router/babel'),
      'react-native-reanimated/plugin',
    ],
  };
};

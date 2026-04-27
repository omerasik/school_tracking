module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          alias: {
            "@": "./",
            "@core": "./src/core",
            "@design": "./src/components/design",
            "@functional": "./src/components/functional",
            "@style": "./src/style",
            "@assets": "./assets",
            "@network": "./src/core/network",
          },
        },
      ],
      "react-native-reanimated/plugin",
    ],
  };
};

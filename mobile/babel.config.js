module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    // Must be listed last. Without it, useAnimatedStyle/useSharedValue etc.
    // never get worklet-transformed, so every Reanimated animation in the
    // app silently no-ops instead of running.
    plugins: ["react-native-worklets/plugin"],
  };
};

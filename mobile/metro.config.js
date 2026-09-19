const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// /mobile is nested inside the Next.js repo, which has its own node_modules
// (including a different React version). Metro, like Node, resolves the
// nearest node_modules first, so mobile/node_modules/react always wins here
// - but block the parent's node_modules from being watched at all so Metro
// never has a reason to even consider it (avoids duplicate-React bundling).
config.watchFolders = [__dirname];

module.exports = withNativeWind(config, { input: "./global.css" });

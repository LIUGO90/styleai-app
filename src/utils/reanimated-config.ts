import { LogBox } from "react-native";

// 抑制 Reanimated 相关的警告
LogBox.ignoreLogs([
  "[Reanimated] Reading from `value` during component render. Please ensure that you don't access the `value` property nor use `get` method of a shared value while React is rendering a component.",
  "[Reanimated] Writing to `value` during component render. Please ensure that you don't access the `value` property nor use the `set` method of a shared value while React is rendering a component.",
  "[Reanimated] You can disable the `strict` mode. Refer to: https://docs.swmansion.com/react-native-reanimated/docs/debugging/logger-configuration for more details.",
]);

// 这个警告通常来自第三方库（如 Expo Router）在内部使用 Reanimated
// 我们通过抑制警告来解决这个问题，因为它不影响应用功能

import { Platform } from "react-native";

// Web 环境的 polyfill 配置
export const setupWebPolyfills = () => {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    // 在 Web 环境中，我们需要确保 React Native 的 StyleSheet 正确配置
    try {
      // 动态导入 React Native 以避免 SSR 问题
      import("react-native")
        .then((RN) => {
          // 如果 StyleSheet.setFlag 存在，设置为 class 模式
          if (RN.StyleSheet && (RN.StyleSheet as any).setFlag) {
            (RN.StyleSheet as any).setFlag("darkMode", "class");

          }
        })
        .catch(() => {
          // 如果导入失败，忽略错误
          console.warn("无法导入 React Native StyleSheet");
        });
    } catch (error) {
      console.warn("Web polyfill 设置失败:", error);
    }
  }
};

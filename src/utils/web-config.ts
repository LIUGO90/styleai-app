import { Platform } from "react-native";

// Web 环境特定的配置
export const configureWebEnvironment = () => {
  if (Platform.OS === "web" && typeof document !== "undefined") {
    try {
      // 在 Web 环境中，我们暂时禁用复杂的暗色模式配置
      // 以避免 StyleSheet.setFlag 相关的错误

    } catch (error) {
      console.warn("Web 环境配置失败:", error);
    }
  }
};

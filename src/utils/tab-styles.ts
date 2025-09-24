import { Platform } from "react-native";

// Tab 样式配置
export const tabStyles = {
  // Tab Bar 整体样式
  tabBarStyle: {
    height: Platform.OS === "ios" ? 88 : 60, // iOS 考虑安全区域
    paddingBottom: Platform.OS === "ios" ? 20 : 8,
    paddingTop: 8,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    elevation: 8, // Android 阴影
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  // Tab 标签文字样式
  tabBarLabelStyle: {
    fontSize: 10,
    fontWeight: "600" as const,
    marginTop: 4,
    letterSpacing: 0.5,
  },

  // Tab 图标样式
  tabBarIconStyle: {
    marginBottom: 2,
  },

  // 徽章样式
  badgeStyle: {
    fontSize: 10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#ef4444",
    color: "#ffffff",
    fontWeight: "bold" as const,
  },

  // 活跃状态样式
  activeTintColor: "#0000ff", // teal
  inactiveTintColor: "#6b7280", // gray-500
};

// 获取图标大小的函数
export const getIconSize = (baseSize: number) => {
  return Platform.OS === "ios" ? baseSize * 1.1 : baseSize * 1.2;
};

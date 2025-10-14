import { Platform } from "react-native";

// Tab 样式配置
export const tabStyles = {
  // Tab Bar 整体样式
  tabBarStyle: {
    height: Platform.OS === "ios" ? 80 : 60, // iOS 考虑安全区域
    paddingBottom: Platform.OS === "ios" ? 20 : 8,
    paddingTop: 6,
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
    marginTop: 2,
    letterSpacing: 0.5,
  },

  // Tab 图标样式
  tabBarIconStyle: {
    marginBottom: 4,
  },

  // 徽章样式
  badgeStyle: {
    fontSize: 10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#ef4444",
    color: "#ffffff",
    fontWeight: "bold" as const,
    lineHeight: 18, // 确保文字垂直居中
    textAlign: "center" as const, // 水平居中
    paddingHorizontal: 5, // 左右内边距
    display: "flex" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },

  // 活跃状态样式
  activeTintColor: "#0000ff", // teal
  inactiveTintColor: "#6b7280", // gray-500
};

// 获取图标大小的函数
export const getIconSize = (baseSize: number) => {
  return Platform.OS === "ios" ? baseSize * 1.1 : baseSize * 1.2;
};

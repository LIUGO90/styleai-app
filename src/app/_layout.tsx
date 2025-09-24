import { Stack } from "expo-router";
import "../../global.css";
import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import "../utils/reanimated-config";
import { LogBox } from "react-native";
import { AuthProvider } from "@/contexts/AuthContext";
import "../utils/authTest"; // 导入认证测试工具
import "../utils/clearUserData"; // 导入清除数据工具
import { appInitializationService } from "@/services/AppInitializationService";

// 忽略 React Native Reanimated 警告
LogBox.ignoreLogs([
  "Warning: Error: Couldn't find a navigation context. Have you wrapped your app with 'NavigationContainer'?",
  "Reanimated 2",
  "Reanimated 3",
]);

export default function RootLayout() {
  useEffect(() => {
    // 初始化应用服务
    const initializeApp = async () => {
      try {
        await appInitializationService.initialize();
      } catch (error) {
        console.error("Failed to initialize app services:", error);
      }
    };

    initializeApp();

    // 清理函数
    return () => {
      appInitializationService.cleanup();
    };
  }, []);

  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="index"
          options={{
            animation: "none",
          }}
        />
        <Stack.Screen
          name="tabs"
          options={{
            animation: "none",
          }}
        />
        <Stack.Screen
          name="onboarding"
          options={{
            animation: "none",
          }}
        />
        <Stack.Screen
          name="Login/index"
          options={{
            animation: "none",
          }}
        />
        <Stack.Screen
          name="ChatScreen"
          options={{
            animation: "none",
          }}
        />
      </Stack>
    </AuthProvider>
  );
}

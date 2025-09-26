import { Tabs } from "expo-router";
import "../../../global.css";
import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { configureWebEnvironment } from "../../utils/web-config";
import { setupWebPolyfills } from "../../utils/web-polyfill";
import { tabStyles, getIconSize } from "../../utils/tab-styles";
import { AuthGuard } from "@/components/AuthGuard";

export default function RootLayout() {
  // 配置 Web 环境
  useEffect(() => {
    configureWebEnvironment();
    setupWebPolyfills();
  }, []);

  // 直接显示主应用 Tabs，让 index.tsx 处理重定向逻辑
  console.log("Showing main app tabs");
  return (
    <AuthGuard>
      <StatusBar style="auto" />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: tabStyles.activeTintColor,
          tabBarInactiveTintColor: tabStyles.inactiveTintColor,
          headerShown: false,
          ...tabStyles,
        }}
        backBehavior="order"
      >
        <Tabs.Screen
          name="styling"
          options={{
            title: "Styling",
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons
                name="palette-outline"
                size={getIconSize(size)}
                color={color}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="lookbook"
          options={{
            title: "Lookbook",
            headerShown: false,
            popToTopOnBlur: true,
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons
                name="book-open-outline"
                size={getIconSize(size)} // 使用动态图标尺寸
                color={color}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="mycloset"
          options={{
            // tabBarBadge: 2,
            tabBarBadgeStyle: tabStyles.badgeStyle,
            title: "Closet",
            headerShown: true,
            popToTopOnBlur: true,
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons
                name="hanger"
                size={getIconSize(size)} // 使用动态图标尺寸
                color={color}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="my"
          options={{
            tabBarBadgeStyle: tabStyles.badgeStyle,
            title: "My",
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons
                name="home-outline"
                size={getIconSize(size)} // 使用动态图标尺寸
                color={color}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="index"
          options={{
            href: null,
          }}
        />

        <Tabs.Screen
          name="onboarding"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </AuthGuard>
  );
}

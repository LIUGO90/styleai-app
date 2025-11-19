import { Tabs, router } from "expo-router";
import "../../../global.css";
import React, { useEffect, useState, useCallback } from "react";
import { StatusBar } from "expo-status-bar";
import { View, StyleSheet } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { configureWebEnvironment } from "../../utils/web-config";
import { setupWebPolyfills } from "../../utils/web-polyfill";
import { tabStyles, getIconSize } from "../../utils/tab-styles";
import { AuthGuard } from "@/components/AuthGuard";
import { getAllBadges, addBadgeListener } from "../../utils/badgeManager";
import { useFocusEffect } from "expo-router";

export default function RootLayout() {
  // 徽章数字状态
  const [lookbookBadge, setLookbookBadge] = useState<number | undefined>(undefined);
  const [closetBadge, setClosetBadge] = useState<number | undefined>(undefined);
  const [myBadge, setMyBadge] = useState<number | undefined>(undefined);

  // 配置 Web 环境
  useEffect(() => {
    configureWebEnvironment();
    setupWebPolyfills();
  }, []);

  // 从 badgeManager 加载徽章数据
  const loadBadgeData = useCallback(async () => {
    try {
      const badges = await getAllBadges();
      setLookbookBadge(badges.lookbook);
      setClosetBadge(badges.closet);
      setMyBadge(badges.my);
    } catch (error) {
      console.error('Failed to load badge data:', error);
    }
  }, []);

  // 初始加载和监听刷新事件
  useEffect(() => {
    // 初始加载
    loadBadgeData();
    
    // 添加监听器，当其他地方调用 triggerBadgeRefresh 时会自动刷新
    const unsubscribe = addBadgeListener(loadBadgeData);
    
    // 设置定时器，每60秒刷新一次（作为兜底）
    const interval = setInterval(loadBadgeData, 60000);
    
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [loadBadgeData]);

  // 当页面获得焦点时也刷新徽章
  useFocusEffect(
    useCallback(() => {
      loadBadgeData();
    }, [loadBadgeData])
  );

  // 直接显示主应用 Tabs，让 index.tsx 处理重定向逻辑

  return (
    <AuthGuard>
      <StatusBar style="auto" />
      <View className="flex-1 bg-white">
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
          name="home"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons
                name="home-outline"
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
            tabBarBadge: lookbookBadge, // 动态徽章数字
            tabBarBadgeStyle: tabStyles.badgeStyle,
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
            tabBarBadge: closetBadge, // 动态徽章数字
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
            tabBarBadge: myBadge, // 动态徽章数字
            tabBarBadgeStyle: tabStyles.badgeStyle,
            title: "My",
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons
                name="account-outline"
                size={getIconSize(size)} // 使用动态图标尺寸
                color={color}
              />
            ),
          }}
          listeners={({ navigation }) => ({
            tabPress: (e) => {
              // 获取当前导航状态
              const state = navigation.getState();
              const currentRoute = state.routes[state.index];
              
              // 检查是否已经在 my tab 的 index 页面
              if (currentRoute.name === 'my') {
                const myState = currentRoute.state;
                
                // 如果没有子路由或者在 index 页面，不做任何操作
                if (!myState || myState.index === 0 || myState.routes[myState.index].name === 'index') {
                  console.log('✅ 已经在 my/index，无需跳转');
                  return; // 不做任何操作
                }
              }
              
              // 在子页面（如 subscription），阻止默认行为并跳转到 index
              e.preventDefault();
              console.log('🔄 从子页面跳转到 my/index');
              router.replace('/tabs/my');
            },
          })}
        />

        <Tabs.Screen
          name="index"
          options={{
            href: null,
          }}
        />

        </Tabs>
      </View>
    </AuthGuard>
  );
}

import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function OnboardingLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: true,
          headerBackTitle: "返回",
          headerStyle: {
            backgroundColor: '#ffffff',
          },
          headerTintColor: '#14b8a6',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      >
        <Stack.Screen 
          name="zero" 
          options={{ 
            title: "欢迎使用，登录后可体验完整功能",
            headerShown: false, // 第一步不显示头部
          }} 
        />
        <Stack.Screen
          name="one"
          options={{ 
            title: "自主时尚搭配",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="two"
          options={{ 
            title: "希望时尚搭配",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="three"
          options={{ 
            title: "时尚搭配",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="four"
          options={{ 
            title: "时尚搭配",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="five"
          options={{ 
            title: "开始体验",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="six"
          options={{ 
            title: "完成",
            headerShown: false,
          }}
        />
      </Stack>
    </>
  );
}

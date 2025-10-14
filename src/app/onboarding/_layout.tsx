import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthGuard } from "@/components/AuthGuard";

export default function OnboardingLayout() {
  return (
    <AuthGuard>
      <StatusBar style="auto" />

      <Stack
        screenOptions={{
          headerShown: true,
          headerBackTitle: "back",
          headerStyle: {
            backgroundColor: "transparent",
          },
          headerTintColor: "#14b8a6",
          headerTitleStyle: {
            fontWeight: "600",
          },
        }}
      >
        {/* <Stack.Screen
          name="BaseOne"
          options={{
            title: "姓名输入",
            headerShown: false,
          }}
        /> */}
        <Stack.Screen
          name="BaseTwo"
          options={{
            title: "性别选择",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="BaseThree"
          options={{
            title: "风格选择",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="BaseFour"
          options={{
            title: "预览图片",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="BaseFive"
          options={{
            title: "自拍",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="BaseSix"
          options={{
            title: "风格选择",
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="YourRange"
          options={{
            title: "自由选择",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="YourRangeOne"
          options={{
            title: "选择肤色",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="YourRangeTwo"
          options={{
            title: "选择体型",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="YourRangeThree"
          options={{
            title: "选择体态",
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

      </Stack>
    </AuthGuard>
  );
}

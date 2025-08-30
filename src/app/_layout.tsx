import { Stack } from "expo-router";
import "../../global.css";
import React from "react";
import { StatusBar } from "expo-status-bar";
import "../utils/reanimated-config";
import { LogBox } from 'react-native';

// 忽略 React Native Reanimated 警告
LogBox.ignoreLogs([
  'Warning: Error: Couldn\'t find a navigation context. Have you wrapped your app with \'NavigationContainer\'?',
  'Reanimated 2',
  'Reanimated 3',
]);

export default function RootLayout() {
  return (
    <React.Fragment>
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
      </Stack>
    </React.Fragment>
  );
}

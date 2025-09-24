import { Drawer } from "expo-router/drawer";
import "../../global.css";
import React from "react";
import { StatusBar } from "expo-status-bar";
import "../utils/reanimated-config";
import { LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MaterialCommunityIcons } from '@expo/vector-icons';

LogBox.ignoreLogs([
  'Warning: Error: Couldn\'t find a navigation context. Have you wrapped your app with \'NavigationContainer\'?',
  'Reanimated 2',
  'Reanimated 3',
]);

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="auto" />
      <Drawer
        screenOptions={{
          headerShown: false,
          drawerActiveTintColor: '#007AFF',
          drawerInactiveTintColor: '#666666',
          drawerStyle: {
            backgroundColor: '#ffffff',
            width: 280,
          },
          drawerLabelStyle: {
            fontSize: 16,
            fontWeight: '500',
          },
          drawerItemStyle: {
            borderRadius: 8,
            marginHorizontal: 8,
            marginVertical: 2,
          },
        }}
      >
        <Drawer.Screen
          name="index"
          options={{
            drawerLabel: '首页',
            drawerIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="home" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="tabs"
          options={{
            drawerLabel: '主应用',
            drawerIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="apps" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="onboarding"
          options={{
            drawerLabel: '引导页',
            drawerIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="account-plus" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="ChatScreen"
          options={{
            drawerLabel: 'AI聊天',
            drawerIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="chat" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="user/[id]"
          options={{
            drawerLabel: '用户详情',
            drawerIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="account" size={size} color={color} />
            ),
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}

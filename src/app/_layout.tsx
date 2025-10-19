import { Stack, useFocusEffect, useRouter } from "expo-router";
import "../../global.css";
import React, { useCallback, useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import "../utils/reanimated-config";
import { Alert, LogBox, Platform } from "react-native";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { CreditProvider } from "@/contexts/CreditContext";
import "../utils/authTest"; // 导入认证测试工具
import "../utils/clearUserData"; // 导入清除数据工具
import { appInitializationService } from "@/services/AppInitializationService";
import { ToastProvider, globalToast } from "@/utils/globalToast";
import { ChatSession, ChatSessionService } from "@/services/ChatSessionService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Drawer } from "expo-router/drawer";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ChatSessionList } from "@/components/ChatSessionList";
import revenueCatService from "@/services/RevenueCatService";

// 忽略 React Native Reanimated 和 RevenueCat 警告
LogBox.ignoreLogs([
  "Warning: Error: Couldn't find a navigation context. Have you wrapped your app with 'NavigationContainer'?",
  "Reanimated 2",
  "Reanimated 3",
  "Reading from `value` during component render",
  "RevenueCat",
  "Invalid API key",
  "Error configuring Purchases",
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

    // Web 端不支持 RevenueCat，只初始化 iOS 平台
    if(Platform.OS === 'ios') {
      initializeApp();
    } 

    // 清理函数
    return () => {
      appInitializationService.cleanup();
    };
  }, []);

  const router = useRouter();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>();

  // 加载会话列表
  const loadSessions = async () => {
    const allSessions = await ChatSessionService.getAllSessions();
    setSessions(allSessions);

    const currentId = await ChatSessionService.getCurrentSessionId();
    setCurrentSessionId(currentId || undefined);
  };

  // 处理会话选择
  const handleSessionSelect = async (session: ChatSession) => {
    await ChatSessionService.setCurrentSession(session.id);
    setCurrentSessionId(session.id);

    // 根据会话类型跳转到对应页面
    switch (session.type) {
      case 'style_an_item':
        router.push({
          pathname: '/style_an_item',
          params: { sessionId: session.id }
        });
        break;
      case 'outfit_check':
        router.push({
          pathname: '/outfit_check',
          params: { sessionId: session.id }
        });
        break;
      case 'free_chat':
        router.push({
          pathname: '/free_chat',
          params: { sessionId: session.id }
        });
        break;
      default:
        router.push('/free_chat');
        break;
    }
  };

  // 处理新建会话
  const handleNewSession = async () => {

  };

  // 处理删除会话
  const handleDeleteSession = async (sessionId: string) => {
    setSessions(prev => prev.filter(session => session.id !== sessionId));
    
    // 如果删除的是当前会话，跳转到主页（tabs）而不是根路径
    if (currentSessionId === sessionId) {
      setCurrentSessionId(undefined);
      router.replace('/');
    }
    await ChatSessionService.deleteSession(sessionId);
  };

  // 清空所有会话
  const handleClearAllSessions = () => {
    Alert.alert(
      'Clear all sessions',
      'Are you sure you want to clear all chat records? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            // 先清空会话
            setSessions([]);
            setCurrentSessionId(undefined);
            
            // 跳转到主页
            router.replace('/');
            await ChatSessionService.clearAllSessions();
          },
        },
      ]
    );
  };

  useEffect(() => {
    loadSessions();

    // 监听会话更新标志
    const checkForUpdates = async () => {
      const refreshFlag = await AsyncStorage.getItem('sessionListRefresh');
      if (refreshFlag) {
        await loadSessions();
        await AsyncStorage.removeItem('sessionListRefresh');
      }
    };

    // 每1秒检查一次更新标志
    const interval = setInterval(checkForUpdates, 1000);

    return () => clearInterval(interval);
  }, []);

  // 当页面获得焦点时刷新会话列表，确保路由打开的会话能正确更新
  useFocusEffect(
    useCallback(() => {
      loadSessions();
    }, [])
  );

  return (
    <AuthProvider>
      <CreditProvider>
        <ToastProvider>
          <Drawer
        screenOptions={{
          headerShown: false,
          drawerActiveTintColor: '#007AFF',
          drawerInactiveTintColor: '#666666',
          drawerStyle: {
            backgroundColor: '#ffffff',
            width: 320,
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
          swipeEnabled: false,
          swipeEdgeWidth: 0,
        }}
        drawerContent={(props) => (
          <View className="flex-1 bg-white mt-12">
            <View style={styles.drawerHeader}>
              {/* <Text style={styles.drawerTitle}>Chat Assistant</Text> */}
              <Pressable
                style={styles.clearButton}
                onPress={handleClearAllSessions}
              >
                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
              </Pressable>
            </View>

            <ChatSessionList
              sessions={sessions}
              currentSessionId={currentSessionId}
              onSessionSelect={handleSessionSelect}
              onNewSession={handleNewSession}
              onDeleteSession={handleDeleteSession}
              onCloseDrawer={props.navigation.closeDrawer}
            />
          </View>
        )}
      >
        <Drawer.Screen
          name="tabs"
          options={{
            drawerLabel: 'Home',
            drawerIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="home-outline" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="style_an_item"
          options={{
            drawerLabel: 'Style an item',
            drawerIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="tshirt-crew" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="outfit_check"
          options={{
            drawerLabel: 'outfit_check',
            drawerIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="check-circle-outline" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="free_chat"
          options={{
            drawerLabel: 'free_chat',
            drawerIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="magic-staff" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="foryou"
          options={{
            drawerLabel: 'foryou',
            drawerIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="heart-outline" size={size} color={color} />
            ),
          }}
        />
      </Drawer>
        </ToastProvider>
      </CreditProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({

  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#f8f9fa',
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  clearButton: {
    padding: 4,
  },
});

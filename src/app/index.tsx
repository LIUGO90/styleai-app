import { Redirect } from "expo-router";
import { View, Text, ActivityIndicator } from "react-native";
import { useAuth } from "@/contexts/AuthContext";

export default function RootIndex() {
  const { user, loading: authLoading } = useAuth();

  // 如果认证还在加载中，显示加载界面
  if (authLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#007AFF" />
        <Text className="mt-4 text-gray-600">Loading...</Text>
      </View>
    );
  }

  // 如果用户未登录，重定向到登录页面
  if (!user) {

    return <Redirect href="/Login" />;
  }

  // 用户已登录且完成引导，重定向到主应用

  return <Redirect href="/tabs" />;
}

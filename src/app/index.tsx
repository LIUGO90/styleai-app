import { Redirect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState, useRef } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useAuth } from "@/contexts/AuthContext";

export default function RootIndex() {
  const { user, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkOnboardingStatus = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem("onboardingData");
        console.log("Onboarding status:", jsonValue);

        if (isMounted) {
          setHasCompletedOnboarding(jsonValue !== null);
          setIsLoading(false);
        }
      } catch (e) {
        console.error("Error reading onboarding status:", e);
        if (isMounted) {
          setHasCompletedOnboarding(false);
          setIsLoading(false);
        }
      }
    };

    checkOnboardingStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  // 如果认证还在加载中，显示加载界面
  if (authLoading || isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#007AFF" />
        <Text className="mt-4 text-gray-600">Loading...</Text>
      </View>
    );
  }

  // 如果用户未登录，重定向到登录页面
  if (!user) {
    console.log("User not authenticated, redirecting to login");
    return <Redirect href="/Login" />;
  }

  // 如果用户已登录但未完成引导，重定向到引导页面
  if (!hasCompletedOnboarding) {
    console.log(
      "User authenticated but onboarding not completed, redirecting to onboarding",
    );
    return <Redirect href="/onboarding" />;
  }

  // 用户已登录且完成引导，重定向到主应用
  console.log(
    "User authenticated and onboarding completed, redirecting to main app",
  );
  return <Redirect href="/tabs" />;
}

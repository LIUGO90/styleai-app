import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import DotsContainer from "@/components/dotsContainer";
import { OnboardingData } from "@/components/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/utils/supabase";

export default function BaseOne() {
  const router = useRouter();
  const [name, setName] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const loadOnboardingData = async () => {

      // 获取用户名
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("name").eq("id", user.id).single();
        setName(profile?.name || "");
      }

      // 获取onboardingData
      const onboardingData = await AsyncStorage.getItem("onboardingData");
      if (onboardingData) {
      } else {
        const onboardingData: OnboardingData = {
          userId: user?.id || "",
          stylePreferences: [],
          fullBodyPhoto: "",
          skinTone: "fair",
          bodyType: "Hourglass",
          bodyStructure: "Petite",
          faceShape: "oval",
          selectedStyles: [],
          gender: ""
        };
        AsyncStorage.setItem("onboardingData", JSON.stringify(onboardingData));
      }
    };
    loadOnboardingData();
  }, []);

  // 保存用户名到Supabase和本地存储
  const saveUserName = async (userName: string) => {
    try {
      // 获取当前用户
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // 保存到Supabase用户资料表
        const { error: supabaseError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            name: userName,
            updated_at: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString(),
          });

        if (supabaseError) {
          console.error('Error saving to Supabase:', supabaseError);
          throw supabaseError;
        }
      }

      AsyncStorage.setItem("name", userName);
      // 保存到本地AsyncStorage
      const existingData = await AsyncStorage.getItem("onboardingData");
      let onboardingData: OnboardingData;

      if (existingData) {
        onboardingData = JSON.parse(existingData) as OnboardingData;
      } else {
        onboardingData = {
          userId: user?.id || "123",
          stylePreferences: [],
          fullBodyPhoto: "",
          skinTone: "",
          bodyType: "",
          bodyStructure: "",
          faceShape: "",
          selectedStyles: [],
          gender: "",
        } as OnboardingData;
      }
      console.log("BaseOne onboardingData", onboardingData);
      await AsyncStorage.setItem("onboardingData", JSON.stringify(onboardingData));

      // 同时保存单独的用户名
      await AsyncStorage.setItem("userName", userName);

      return true;
    } catch (error) {
      console.error('Error saving user name:', error);
      return false;
    }
  };

  const handleNext = async () => {
    console.log("handleNext", name);
    if (name.trim() !== "") {
      setIsLoading(true);

      try {
        // 保存用户名到Supabase和本地存储
        const success = await saveUserName(name.trim());

        if (success) {
          console.log("User name saved successfully");
          // 导航到下一页
          router.push({
            pathname: "/onboarding/BaseTwo",
            params: { username: name.toString() },
          });
        } else {
          // 即使保存失败，也允许继续（可能是网络问题）
          console.warn("Failed to save user name, but continuing...");
          router.push({
            pathname: "/onboarding/BaseTwo",
            params: { username: name.toString() },
          });
        }
      } catch (error) {
        console.error("Error in handleNext:", error);
        // 即使出错也继续流程
        router.push({
          pathname: "/onboarding/BaseTwo",
          params: { username: name.toString() },
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSkip = async () => {
    try {
      // const AsyncStorage = await import('@react-native-async-storage/async-storage');
      // await AsyncStorage.default.setItem('my-key', 'completed');
      router.replace("/(tabs)/styling");
    } catch (e) {
      console.error("Error saving onboarding status:", e);
    }
  };

  return (
    <View className="flex-1">
      {/* 背景图片 */}
      <Image
        source={require("../../../assets/background.png")}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        cachePolicy="memory-disk"
      />

      {/* 内容层 */}
      <View className="flex-1">
        <View className="mt-14">
          <DotsContainer activeIndex={1} indexNumber={6} />
        </View>
        <KeyboardAvoidingView
          behavior="padding"
          className="flex-1"
          // keyboardVerticalOffset={58}
          accessibilityRole="none"
        >
          <View className="flex-1 justify-center px-5 py-10">
            <Text className="text-2xl font-bold text-start mb-8 text-gray-800">
              Hi, I’m Styla. Your personal stylist.
              {"\n\n"}
              What’s your name?
            </Text>
            <View className="space-y-4">
              <TextInput
                className="border-2 border-gray-300 rounded-xl p-4 text-lg"
                placeholder="Enter your name"
                value={name.toString()}
                onChangeText={setName}
                style={{ fontSize: 18, minHeight: 50 }}
              />
            </View>
          </View>

          <View className="p-5 my-10">
            <View className="flex-row space-x-4">
              <Pressable
                onPress={handleNext}
                className={`flex-1 py-5 px-6 rounded-full ${name.trim() !== "" && !isLoading ? "bg-black" : "bg-gray-300"
                  }`}
                disabled={name.trim() === "" || isLoading}
              >
                <Text
                  className={`text-center font-medium ${name.trim() !== "" && !isLoading ? "text-white" : "text-gray-500"
                    }`}
                >
                  {isLoading ? "Saving..." : "Continue"}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

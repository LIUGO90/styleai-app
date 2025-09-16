import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import DotsContainer from "@/components/dotsContainer";
import { OnboardingData } from "@/components/types";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function BaseOne() {
  const router = useRouter();
  const [name, setName] = useState<string>("");

  useEffect(() => {
    const loadOnboardingData = async () => {
      const onboardingData = await AsyncStorage.getItem("onboardingData");
      if (onboardingData) {
      } else {
        const onboardingData: OnboardingData = {
          userId: "123",
          stylePreferences: [],
          fullBodyPhoto: "",
          skinTone: "",
          bodyType: "",
          bodyStructure: "",
          faceShape: "",
          selectedStyles: [],
        };
        AsyncStorage.setItem("onboardingData", JSON.stringify(onboardingData));
      }
    };
    loadOnboardingData();
  }, []);

  const handleNext = async () => {
    console.log("handleNext", name);
    if (name !== null) {
      // const onboardingData = await AsyncStorage.getItem('onboardingData');
      // 使用对象形式
      router.push({
        pathname: "/onboarding/BaseTwo",
        params: { username: name.toString() },
      });
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
        <ScrollView>
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
                className={`flex-1 py-5 px-6 rounded-full ${
                  name !== "" ? "bg-black" : "bg-gray-300"
                }`}
                disabled={name === ""}
              >
                <Text
                  className={`text-center font-medium ${
                    name !== "" ? "text-white" : "text-gray-500"
                  }`}
                >
                  Continue
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

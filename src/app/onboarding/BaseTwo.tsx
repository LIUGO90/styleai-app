import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import DotsContainer from "@/components/dotsContainer";
import { OnboardingData } from "@/components/types";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function BaseTwo() {
  const chooseTitles = ["Female", "Male", "Other"];

  const router = useRouter();
  const { username } = useLocalSearchParams<{ username: string }>();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    // 记录接收到的路由参数
    console.log("BaseTwo received params:", { username });

    const loadOnboardingData = async () => {
      const onboardingData = await AsyncStorage.getItem("onboardingData");
      if (onboardingData) {
        const onboardingDataObj = JSON.parse(onboardingData) as OnboardingData;
        setSelectedIndex(onboardingDataObj.gender ? 0 : 1);
      } else {
        setSelectedIndex(null);
      }
    };
    loadOnboardingData();
  }, []);

  const handleNext = async () => {
    console.log("handleNext", selectedIndex);
    if (selectedIndex !== null) {
      const onboardingData = await AsyncStorage.getItem("onboardingData");
      if (onboardingData) {
        const onboardingDataObj = JSON.parse(onboardingData) as OnboardingData;
        onboardingDataObj.gender = selectedIndex === 0 ? "Female" : "Male";
        await AsyncStorage.setItem(
          "onboardingData",
          JSON.stringify(onboardingDataObj),
        );
      }
      router.push("/onboarding/BaseThree");
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

  const handleSelect = (index: number) => {
    setSelectedIndex(index);
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
          <DotsContainer activeIndex={2} indexNumber={6} />
        </View>
        {/* <ScrollView> */}
          <View className="flex-1 justify-center px-5 py-10">
            <Text className="text-2xl font-bold text-start mb-8 text-gray-800">
              Nice to meet you, {username || "there"}.{"\n"}
              How do you identify yourself?
            </Text>

            <View className="space-y-4">
              {chooseTitles.map((title, index) => (
                <Pressable
                  key={index}
                  onPress={() => handleSelect(index)}
                  className={`p-4 rounded-xl border-2 my-2 ${
                    selectedIndex === index
                      ? "border-blue-500 "
                      : "border-gray-200 "
                  }`}
                >
                  <View className="flex-row items-center justify-between">
                    <Text
                      className={`text-lg font-medium ${
                        selectedIndex === index
                          ? "text-blue-600"
                          : "text-gray-700"
                      }`}
                    >
                      {title}
                    </Text>
                    {selectedIndex === index && (
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={24}
                        color="#3b82f6"
                      />
                    )}
                  </View>
                </Pressable>
              ))}
            </View>
          </View>

          <View className="p-5 my-10">
            <View className="flex-row space-x-4">
              <Pressable
                onPress={handleNext}
                className={`flex-1 py-5 px-6 rounded-full ${
                  selectedIndex !== null ? "bg-black" : "bg-gray-300"
                }`}
                disabled={selectedIndex === null}
              >
                <Text
                  className={`text-center font-medium ${
                    selectedIndex !== null ? "text-white" : "text-gray-500"
                  }`}
                >
                  Continue
                </Text>
              </Pressable>
            </View>
          </View>
        {/* </ScrollView> */}
      </View>
    </View>
  );
}

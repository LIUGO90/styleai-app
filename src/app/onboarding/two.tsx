import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import DotsContainer from "@/components/dotsContainer";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { OnboardingData } from "@/components/types";
import { Image } from "expo-image";

export default function OnboardingTwo() {
  const chooseTitles = [
    "Get new outfit ideas for my clothes",
    "Elevate my outfits to look better",
    "Develop my personal style",
    "Discover my perfect colors & flattering silhouettes",
    "Create an outfit for a special event",
    "Buy less and shop smarter",
  ];
  const router = useRouter();
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

  useEffect(() => {
    const loadOnboardingData = async () => {
      const onboardingData = await AsyncStorage.getItem("onboardingData");
      if (onboardingData) {
        const onboardingDataObj = JSON.parse(onboardingData) as OnboardingData;
        if (onboardingDataObj.fullBodyPhoto.length !== 0) {
          setSelectedIndices(
            onboardingDataObj.stylePreferences.map((item) =>
              chooseTitles.indexOf(item),
            ),
          );
        }
      }
    };
    loadOnboardingData();
  }, []);

  const handleNext = async () => {
    console.log("handleNext", selectedIndices);
    if (selectedIndices.length > 0) {
      const onboardingData = await AsyncStorage.getItem("onboardingData");
      if (onboardingData) {
        const onboardingDataObj = JSON.parse(onboardingData) as OnboardingData;
        onboardingDataObj.stylePreferences = selectedIndices.map(
          (index) => chooseTitles[index],
        );
        await AsyncStorage.setItem(
          "onboardingData",
          JSON.stringify(onboardingDataObj),
        );
      }
      router.push("/onboarding/three");
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
    setSelectedIndices((prev) => {
      if (prev.includes(index)) {
        // 如果已选中，则取消选中
        return prev.filter((i) => i !== index);
      } else {
        // 如果未选中，则添加到选中列表
        return [...prev, index];
      }
    });
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
      <View className="mt-14">
        <DotsContainer activeIndex={2} indexNumber={6} />
      </View>
      <ScrollView>
        <View className="flex-1 justify-center px-5">
          <Text className="text-2xl font-bold text-center mb-8 text-gray-800">
            What’d you like StyleMe to focus on?
          </Text>

          <View className="space-y-4">
            {chooseTitles.map((title, index) => (
              <Pressable
                key={index}
                onPress={() => handleSelect(index)}
                className={`p-4 rounded-xl border-2 my-2 ${
                  selectedIndices.includes(index)
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <View className="flex-row items-center">
                  <Text
                    className={`text-lg font-medium flex-1 pr-1 ${
                      selectedIndices.includes(index)
                        ? "text-blue-600"
                        : "text-gray-700"
                    }`}
                  >
                    {title}
                  </Text>
                  <View className="w-8 h-8 items-center justify-center">
                    {selectedIndices.includes(index) && (
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={24}
                        color="#3b82f6"
                      />
                    )}
                  </View>
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
                selectedIndices.length > 0 ? "bg-blue-500" : "bg-gray-300"
              }`}
              disabled={selectedIndices.length === 0}
            >
              <Text
                className={`text-center font-medium ${
                  selectedIndices.length > 0 ? "text-white" : "text-gray-500"
                }`}
              >
                Continue
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import DotsContainer from "@/components/dotsContainer";
import { OnboardingData } from "@/components/types";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function OnboardingOne() {
  const chooseTitles = ["Totally", "Not Really"];
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    const loadOnboardingData = async () => {
      const onboardingData = await AsyncStorage.getItem("onboardingData");
      if (onboardingData) {
        const onboardingDataObj = JSON.parse(onboardingData) as OnboardingData;
        if (onboardingDataObj.stylePreferences.length !== 0) {
          setSelectedIndex(onboardingDataObj.hasStylingDifficulty ? 0 : 1);
        }
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
    console.log("handleNext", selectedIndex);
    if (selectedIndex !== null) {
      const onboardingData = await AsyncStorage.getItem("onboardingData");
      if (onboardingData) {
        const onboardingDataObj = JSON.parse(onboardingData) as OnboardingData;
        onboardingDataObj.hasStylingDifficulty = selectedIndex === 0;
        await AsyncStorage.setItem(
          "onboardingData",
          JSON.stringify(onboardingDataObj),
        );
      }
      router.push("/onboarding/two");
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
          <DotsContainer activeIndex={1} indexNumber={6} />
        </View>
        <ScrollView>
          <View className="flex-1 justify-center px-5">
            <Text className="text-2xl font-bold text-center mb-8 text-gray-800">
              Do you have clothes that you don't know how to style?
            </Text>

            <View className="space-y-4">
              {chooseTitles.map((title, index) => (
                <Pressable
                  key={index}
                  onPress={() => handleSelect(index)}
                  className={`p-4 rounded-xl border-2 my-2 ${
                    selectedIndex === index
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-white"
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
                  selectedIndex !== null ? "bg-blue-500" : "bg-gray-300"
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
        </ScrollView>
      </View>
    </View>
  );
}

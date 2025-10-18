import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import DotsContainer from "@/components/dotsContainer";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { OnboardingData } from "@/components/types";
import { SafeAreaView } from "react-native-safe-area-context";

export default function YourRangeOne() {
  // 肤色选项数据- Fair
  // - Fair
  // - Light
  // - Medium
  // - Tan
  // - Dark
  // - Deep Dark
  const SKIN_TONE_OPTIONS = [
    {
      id: "fair",
      label: "Fair",
      color: "#FFEADF",
      description: "Fair skin tone",
    },
    {
      id: "light",
      label: "Light",
      color: "#F1D1AC",
      description: "Light skin tone",
    },
    {
      id: "medium",
      label: "Medium",
      color: "#D9AC7E",
      description: "Medium skin tone",
    },
    {
      id: "tan",
      label: "Tan",
      color: "#AE725B",
      description: "Tan skin tone",
    },
    {
      id: "dark",
      label: "Dark",
      color: "#6B3C2C",
      description: "Dark skin tone",
    },
    {
      id: "deep-dark",
      label: "Deep Dark",
      color: "#3F2414",
      description: "Deep dark skin tone",
    },
  ];

  const router = useRouter();
  const [selectedSkinTone, setSelectedSkinTone] = useState<string | null>(null);
  useEffect(() => {
    const loadOnboardingData = async () => {
      const onboardingData = await AsyncStorage.getItem("onboardingData");
      if (onboardingData) {
        const onboardingDataObj = JSON.parse(onboardingData) as OnboardingData;
        if (onboardingDataObj.skinTone) {
          setSelectedSkinTone(onboardingDataObj.skinTone);
        }
      } else {
        setSelectedSkinTone(null);
      }
    };
    loadOnboardingData();
  }, []);

  const handleSkip = async () => {
    router.replace("/");
  };

  const handleNext = async () => {
    if (selectedSkinTone) {
      const onboardingData = await AsyncStorage.getItem("onboardingData");
      if (onboardingData) {
        const onboardingDataObj = JSON.parse(onboardingData) as OnboardingData;
        onboardingDataObj.skinTone = selectedSkinTone;
        await AsyncStorage.setItem(
          "onboardingData",
          JSON.stringify(onboardingDataObj),
        );
      }
      router.replace("/onboarding/YourRangeTwo");
    }
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1">
      {/* 背景图片 */}
      <Image
        source={require("../../../assets/background.png")}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        cachePolicy="memory-disk"
      />

      {/* 内容层 */}
      <View className="flex-1">
        {/* 顶部部分 */}
        <View className="flex-1 px-5 py-10">
          <View className="flex-1 justify-center my-20">
            <Text className="text-2xl font-bold text-start mb-2 text-black">
              Select your skin tone
            </Text>
            {/* 肤色选择 */}
            <View className="mt-10">
              <View className="flex-row flex-wrap justify-between ">
                {SKIN_TONE_OPTIONS.map((option) => (
                  <Pressable
                    key={option.id}
                    onPress={() => setSelectedSkinTone(option.id)}
                    className={`items-center p-3 rounded-xl border-2 w-[30%] mb-3 ${
                      selectedSkinTone === option.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <View
                      style={{
                        width: 60,
                        height: 60,
                        backgroundColor: option.color,
                        borderRadius: 30,
                        borderWidth: 2,
                        borderColor:
                          selectedSkinTone === option.id
                            ? "#3b82f6"
                            : "#e5e7eb",
                      }}
                    />
                    <Text className="text-xs mt-1 text-center text-gray-600">
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        </View>
        {/* 底部部分 */}
        <View className="p-5 mb-20">
          <View className="flex-col">
            <Pressable
              onPress={handleNext}
              className={`py-5 px-6 rounded-full ${selectedSkinTone ? "bg-black" : "bg-gray-300"}`}
              disabled={false}
            >
              <Text className={`text-center font-medium text-white`}>Next</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

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
import { OnboardingData } from "@/components/types";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function YourRangeThree() {
  // 身体量感结构选项数据
  const BODY_STRUCTURE_OPTIONS = [
    {
      id: "Petite",
      label: "Petite",
      image: require("../../../assets/onboarding/BodyStructure/petite.jpeg"),
    },
    {
      id: "Slim",
      label: "Slim",
      image: require("../../../assets/onboarding/BodyStructure/slim.jpeg"),
    },
    {
      id: "Average",
      label: "Average",
      image: require("../../../assets/onboarding/BodyStructure/average.jpeg"),
    },
    {
      id: "Chubby",
      label: "Chubby",
      image: require("../../../assets/onboarding/BodyStructure/chubby.jpeg"),
    },
    {
      id: "Plus-size",
      label: "Plus-size",
      image: require("../../../assets/onboarding/BodyStructure/plus.jpeg"),
    },
  ];

  const router = useRouter();
  const [selectedBodyStructure, setSelectedBodyStructure] = useState<
    string | null
  >(null);
  useEffect(() => {
    const loadOnboardingData = async () => {
      const onboardingData = await AsyncStorage.getItem("onboardingData");
      if (onboardingData) {
        const onboardingDataObj = JSON.parse(onboardingData) as OnboardingData;
        if (onboardingDataObj.bodyStructure) {
          setSelectedBodyStructure(onboardingDataObj.bodyStructure);
        }
      }
    };
    loadOnboardingData();
  }, []);
  const handleSkip = async () => {
    router.replace("/");
  };

  const handleNext = async () => {
    if (selectedBodyStructure) {
      // router.dismissAll();
      // router.replace("/");
      const onboardingData = await AsyncStorage.getItem("onboardingData");
      if (onboardingData) {
        const onboardingDataObj = JSON.parse(onboardingData) as OnboardingData;
        onboardingDataObj.bodyStructure = selectedBodyStructure;
        await AsyncStorage.setItem(
          "onboardingData",
          JSON.stringify(onboardingDataObj),
        );
      }
      router.replace("/");
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
        {/* 顶部部分 */}
        <View className="flex-1 px-5 py-10">
          <View className="flex-1 justify-center my-20">
            <Text className="text-2xl font-bold text-start mb-2 text-black">
              Select your body size
            </Text>
            {/* 肤色选择 */}
            <View className="mt-10">
              <View className="flex-row flex-wrap">
                {BODY_STRUCTURE_OPTIONS.map((option, index) => (
                  <Pressable
                    key={option.id}
                    onPress={() => setSelectedBodyStructure(option.id)}
                    className={`items-center p-2 rounded-xl border-2 w-[30%] mb-3 ${
                      selectedBodyStructure === option.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-white"
                    }`}
                    style={{
                      marginRight: (index + 1) % 3 === 0 ? 0 : "3.33%",
                    }}
                  >
                    <View className="w-24 h-32 bg-gray-100 rounded-lg overflow-hidden items-center justify-center">
                      <Image
                        source={option.image}
                        style={{
                          width: "100%",
                          height: "100%",
                        }}
                        resizeMode="cover"
                      />
                    </View>
                    <Text
                      className={`text-xs mt-1 font-medium text-center ${
                        selectedBodyStructure === option.id
                          ? "text-blue-600"
                          : "text-gray-700"
                      }`}
                    >
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
              className={`py-5 px-6 rounded-full ${selectedBodyStructure ? "bg-black" : "bg-gray-300"}`}
              disabled={false}
            >
              <Text className={`text-center font-medium text-white`}>Next</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

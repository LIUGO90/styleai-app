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

export default function YourRangeTwo() {
  // 体型选项数据
  const BODY_TYPE_OPTIONS = [
    {
      id: "Hourglass",
      label: "Hourglass",
      image: require("../../../assets/onboarding/BodyType/hourglass.jpeg"),
    },
    {
      id: "Pear",
      label: "Pear",
      image: require("../../../assets/onboarding/BodyType/pear.jpeg"),
    },
    {
      id: "Triangle",
      label: "Triangle",
      image: require("../../../assets/onboarding/BodyType/triangle.jpeg"),
    },
    {
      id: "Inverted Triangle",
      label: "Inverted",
      image: require("../../../assets/onboarding/BodyType/invertedTriangle.jpeg"),
    },
    {
      id: "Rectangle",
      label: "Rectangle",
      image: require("../../../assets/onboarding/BodyType/rectangle.jpeg"),
    },
    {
      id: "Apple",
      label: "Apple",
      image: require("../../../assets/onboarding/BodyType/apple.jpeg"),
    },
  ];

  const router = useRouter();
  const [selectedBodyType, setSelectedBodyType] = useState<string | null>(null);

  useEffect(() => {
    const loadOnboardingData = async () => {
      const onboardingData = await AsyncStorage.getItem("onboardingData");
      if (onboardingData) {
        const onboardingDataObj = JSON.parse(onboardingData) as OnboardingData;
        if (onboardingDataObj.bodyType) {
          setSelectedBodyType(onboardingDataObj.bodyType);
        }
      } else {
        setSelectedBodyType(null);
      }
    };
    loadOnboardingData();
  }, []);

  const handleSkip = async () => {
    router.replace("/");
  };

  const handleNext = async () => {
    if (selectedBodyType) {
      const onboardingData = await AsyncStorage.getItem("onboardingData");
      if (onboardingData) {
        const onboardingDataObj = JSON.parse(onboardingData) as OnboardingData;
        onboardingDataObj.bodyType = selectedBodyType;
        await AsyncStorage.setItem(
          "onboardingData",
          JSON.stringify(onboardingDataObj),
        );
      }
      router.push("/onboarding/YourRangeThree");
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
        <View className="flex-1 px-5 py-10">
          <View className="flex-1 justify-center my-20">
            <Text className="text-2xl font-bold text-start mb-2 text-black">
              Select your body type
            </Text>
            {/* 肤色选择 */}
            <View className="mt-10">
              <View className="flex-row flex-wrap justify-between ">
                {BODY_TYPE_OPTIONS.map((option, index) => (
                  <Pressable
                    key={option.id}
                    onPress={() => setSelectedBodyType(option.id)}
                    className={`items-center p-2 rounded-xl border-2 w-[30%] mb-3 ${
                      selectedBodyType === option.id
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
                        selectedBodyType === option.id
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
              className={`py-5 px-6 rounded-full ${selectedBodyType ? "bg-black" : "bg-gray-300"}`}
              disabled={false}
            >
              <Text className={`text-center font-medium text-white`}>Next</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
  );
}

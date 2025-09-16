import React, { useEffect, useState } from "react";
import DotsContainer from "@/components/dotsContainer";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { OnboardingData } from "@/components/types";

export default function Four() {
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

  // 脸型选项数据
  const FACE_SHAPE_OPTIONS = [
    {
      id: "oval",
      label: "Oval",
      icon: "🥚",
      description: "Balanced and versatile",
    },
    {
      id: "round",
      label: "Round",
      icon: "⭕",
      description: "Soft and circular",
    },
    {
      id: "square",
      label: "Square",
      icon: "⬜",
      description: "Strong and angular",
    },
    {
      id: "heart",
      label: "Heart",
      icon: "💝",
      description: "Wide forehead,pointed chin",
    },
  ];

  const router = useRouter();

  // 状态管理
  const [selectedSkinTone, setSelectedSkinTone] = useState<string | null>(null);
  const [selectedBodyType, setSelectedBodyType] = useState<string | null>(null);
  const [selectedBodyStructure, setSelectedBodyStructure] = useState<
    string | null
  >(null);
  const [selectedFaceShape, setSelectedFaceShape] = useState<string | null>(
    null,
  );

  // 检查是否所有选项都已选择
  const isAllSelected =
    selectedSkinTone &&
    selectedBodyType &&
    selectedBodyStructure &&
    selectedFaceShape;

  useEffect(() => {
    const loadOnboardingData = async () => {
      const onboardingData = await AsyncStorage.getItem("onboardingData");
      if (onboardingData) {
        const onboardingDataObj = JSON.parse(onboardingData) as OnboardingData;
        if (onboardingDataObj.selectedStyles.length !== 0) {
          setSelectedSkinTone(onboardingDataObj.skinTone);
          setSelectedBodyType(onboardingDataObj.bodyType);
          setSelectedBodyStructure(onboardingDataObj.bodyStructure);
          setSelectedFaceShape(onboardingDataObj.faceShape);
        }
      }
    };
    loadOnboardingData();
  }, []);

  const handleNext = async () => {
    console.log("handleNext", selectedSkinTone);
    if (isAllSelected) {
      const onboardingData = await AsyncStorage.getItem("onboardingData");
      if (onboardingData) {
        const onboardingDataObj = JSON.parse(onboardingData) as OnboardingData;
        onboardingDataObj.skinTone = selectedSkinTone;
        onboardingDataObj.bodyType = selectedBodyType;
        onboardingDataObj.bodyStructure = selectedBodyStructure;
        onboardingDataObj.faceShape = selectedFaceShape;
        await AsyncStorage.setItem(
          "onboardingData",
          JSON.stringify(onboardingDataObj),
        );
      }
      router.push("/onboarding/five");
    }
  };

  const handleSkip = () => {
    router.push("/onboarding/five");
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
        <DotsContainer activeIndex={4} indexNumber={6} />
      </View>
      <ScrollView>
        <View className="flex-1 justify-center px-5">
          <Text className="text-2xl font-bold text-center mb-8 text-gray-800">
            Skin tone & body analysis based on your photo
          </Text>
          <Text className="text-gray-600 text-center mb-8">
            You can change it if it's not accurate
          </Text>

          {/* 肤色选择 */}
          <View className="mb-8">
            <Text className="text-lg font-semibold text-gray-800 mb-4">
              Skin Tone
            </Text>
            <View className="flex-row justify-between px-2">
              {SKIN_TONE_OPTIONS.map((option) => (
                <Pressable
                  key={option.id}
                  onPress={() => setSelectedSkinTone(option.id)}
                  className={`items-center p-2 rounded-xl border-2 flex-1 mx-1 ${
                    selectedSkinTone === option.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      backgroundColor: option.color,
                      borderRadius: 16,
                      borderWidth: 2,
                      borderColor:
                        selectedSkinTone === option.id ? "#3b82f6" : "#e5e7eb",
                    }}
                  />
                </Pressable>
              ))}
            </View>
            {selectedSkinTone && (
              <Text className="text-sm mt-2 text-center text-blue-600 font-medium">
                Selected:{" "}
                {
                  SKIN_TONE_OPTIONS.find((opt) => opt.id === selectedSkinTone)
                    ?.label
                }
              </Text>
            )}
          </View>

          {/* 体型选择 */}
          <View className="mb-8">
            <Text className="text-lg font-semibold text-gray-800 mb-4">
              Body Type
            </Text>
            <View className="flex-row flex-wrap px-2">
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
                  <View className="w-12 h-16 bg-gray-100 rounded-lg overflow-hidden items-center justify-center">
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
            {selectedBodyType && (
              <Text className="text-sm mt-2 text-center text-blue-600 font-medium">
                Selected:{" "}
                {
                  BODY_TYPE_OPTIONS.find((opt) => opt.id === selectedBodyType)
                    ?.label
                }
              </Text>
            )}
          </View>

          {/* 身体结构选择 */}
          <View className="mb-8">
            <Text className="text-lg font-semibold text-gray-800 mb-4">
              Body Structure
            </Text>
            <View className="flex-row flex-wrap px-2">
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
                  <View className="w-12 h-16 bg-gray-100 rounded-lg overflow-hidden items-center justify-center">
                    <Image
                      source={option.image}
                      style={{
                        width: "120%",
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
            {selectedBodyStructure && (
              <Text className="text-sm mt-2 text-center text-blue-600 font-medium">
                Selected:{" "}
                {
                  BODY_STRUCTURE_OPTIONS.find(
                    (opt) => opt.id === selectedBodyStructure,
                  )?.label
                }
              </Text>
            )}
          </View>

          {/* 脸型选择 */}
          <View className="mb-8">
            <Text className="text-lg font-semibold text-gray-800 mb-4">
              Face Shape
            </Text>
            <View className="flex-row justify-between px-2">
              {FACE_SHAPE_OPTIONS.map((option) => (
                <Pressable
                  key={option.id}
                  onPress={() => setSelectedFaceShape(option.id)}
                  className={`items-center p-2 rounded-xl border-2 flex-1 mx-1 ${
                    selectedFaceShape === option.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <Text className="text-xl">{option.icon}</Text>
                  <Text
                    className={`text-xs mt-1 font-medium text-center ${
                      selectedFaceShape === option.id
                        ? "text-blue-600"
                        : "text-gray-700"
                    }`}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            {selectedFaceShape && (
              <Text className="text-sm mt-2 text-center text-blue-600 font-medium">
                Selected:{" "}
                {
                  FACE_SHAPE_OPTIONS.find((opt) => opt.id === selectedFaceShape)
                    ?.label
                }
              </Text>
            )}
          </View>

          {/* 进度指示器 */}
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-sm text-gray-600">Progress</Text>
              <Text className="text-sm text-blue-600 font-medium">
                {
                  [
                    selectedSkinTone,
                    selectedBodyType,
                    selectedBodyStructure,
                    selectedFaceShape,
                  ].filter(Boolean).length
                }
                /4
              </Text>
            </View>
            <View className="w-full bg-gray-200 rounded-full h-2">
              <View
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${([selectedSkinTone, selectedBodyType, selectedBodyStructure, selectedFaceShape].filter(Boolean).length / 4) * 100}%`,
                }}
              />
            </View>
          </View>

          {/* 底部按钮 */}
          <View className="p-5 mb-20">
            <View className="flex-row space-x-4">
              <Pressable
                onPress={handleNext}
                className={`flex-1 py-3 px-6 rounded-full ${
                  isAllSelected ? "bg-blue-500" : "bg-gray-300"
                }`}
                disabled={!isAllSelected}
              >
                <Text
                  className={`text-center font-medium ${
                    isAllSelected ? "text-white" : "text-gray-500"
                  }`}
                >
                  Continue
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

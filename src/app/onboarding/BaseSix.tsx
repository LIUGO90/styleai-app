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
import { useRouter } from "expo-router";
import DotsContainer from "@/components/dotsContainer";

export default function BaseSix() {
  const router = useRouter();
  const [name, setName] = useState<string>("");
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const image = [
    require("../../../assets/onboarding/Final/1.jpg"),
    require("../../../assets/onboarding/Final/2.jpg"),
  ];
  const handleNext = async () => {
    router.dismissAll();
    router.replace("/");
  };

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
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
          <DotsContainer activeIndex={5} indexNumber={6} />
        </View>
        <ScrollView>
          <View
            className="flex-row justify-between px-5"
            style={{ height: 260 }}
          >
            <Image
              source={image[0]}
              contentFit="cover"
              cachePolicy="memory-disk"
              style={{
                width: "48%",
                height: "100%",
                borderRadius: 12,
                backgroundColor: "#f0f0f0",
              }}
            />
            <Image
              source={image[1]}
              contentFit="cover"
              cachePolicy="memory-disk"
              style={{
                width: "48%",
                height: "100%",
                borderRadius: 12,
                backgroundColor: "#f0f0f0",
              }}
            />
          </View>

          <View className="flex-1 justify-center px-5 py-8">
            <Text className="text-2xl font-bold text-start mb-8 text-gray-800">
              Your Personalized Lookbook is ready. Unlock NOW!
            </Text>
            <Text className="text-sm font-bold text-start  text-gray-800">
              √ Find your personal style to dress confidently{"\n"}√ Get new
              outfit ideas of any item{"\n"}√ Elevate your everyday look{"\n"}
            </Text>
          </View>

          <View className="flex-row justify-between h-40 px-5">
            <Pressable
              onPress={() => handlePlanSelect("monthly")}
              className={`flex-1 rounded-3xl border-2 h-40 mx-2 overflow-hidden ${
                selectedPlan === "monthly"
                  ? "border-orange-500 bg-orange-50"
                  : "border-gray-300"
              }`}
              disabled={false}
            >
              <View className="flex-1 overflow-hidden bg-gray-300">
                <View className="flex-1 bg-white rounded-t-3xl rounded-3xl">
                  <Text className={`text-center py-5 font-medium text-black`}>
                    Monthly
                  </Text>
                  <Text
                    className={`text-sm py-2 text-center font-medium text-gray-500`}
                  >
                    $0.33 per day
                  </Text>
                </View>
                <Text
                  className={`text-center py-2 font-medium text-orange-500 h-10`}
                >
                  $9.99
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => handlePlanSelect("quarterly")}
              className={`flex-1 rounded-3xl border-2 h-40 mx-2 relative ${
                selectedPlan === "quarterly"
                  ? "border-orange-500 bg-orange-50"
                  : "border-gray-300 bg-gray-300"
              }`}
              disabled={false}
            >
              {/* 优惠标签 */}
              <View className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 z-10">
                <View className="bg-orange-500 rounded-2xl px-3 py-1">
                  <Text className="text-white text-xs font-bold">10% OFF</Text>
                </View>
              </View>
              <View className="flex-1  overflow-hidden bg-gray-300 rounded-3xl">
                <View className="flex-1 bg-white rounded-t-3xl rounded-3xl">
                  <Text className={`text-center py-5 font-medium text-black`}>
                    Quarterly
                  </Text>
                  <Text
                    className={`text-sm py-2 text-center font-medium text-gray-500`}
                  >
                    $0.28 per day
                  </Text>
                </View>
                <Text
                  className={`text-center py-2 font-medium text-orange-500 h-10`}
                >
                  $24.99
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => handlePlanSelect("yearly")}
              className={`flex-1 rounded-3xl border-2 h-40 mx-2 relative ${
                selectedPlan === "yearly"
                  ? "border-orange-500 bg-orange-50"
                  : "border-gray-300 bg-gray-300"
              }`}
              disabled={false}
            >
              {/* 优惠标签 */}
              <View className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 z-10">
                <View className="bg-orange-500 rounded-2xl px-3 py-1">
                  <Text className="text-white text-xs font-bold">10% OFF</Text>
                </View>
              </View>
              <View className="flex-1  overflow-hidden bg-gray-300 rounded-3xl">
                <View className="flex-1 bg-white rounded-t-3xl rounded-3xl">
                  <Text className={`text-center py-5 font-medium text-black`}>
                    Yearly
                  </Text>
                  <Text
                    className={`text-sm py-2 text-center font-medium text-gray-500`}
                  >
                    $0.23 per day
                  </Text>
                </View>
                <Text
                  className={`text-center py-2 font-medium text-orange-500 h-10`}
                >
                  $84.99
                </Text>
              </View>
            </Pressable>
          </View>

          <View className="p-5 my-10">
            <View className="flex-row space-x-4">
              <Pressable
                onPress={handleNext}
                className={`flex-1 py-5 px-6 rounded-full bg-black `}
                disabled={false}
              >
                <Text className={`text-center font-medium text-white`}>
                  Start 3-days Free Trial
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

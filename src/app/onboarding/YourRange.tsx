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
import { SafeAreaView } from "react-native-safe-area-context";

export default function YourRange() {
  const router = useRouter();

  const handleSkip = async () => {
    router.replace("/");
  };

  const handleNext = async () => {
    router.push("/onboarding/YourRangeOne");
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
          <View className="flex-1 mt-20">
            <Text className="text-2xl font-bold text-start mb-2 text-black">
              Enter your age range
            </Text>
          </View>
        </View>

        {/* 底部部分 */}
        <View className="p-5 mb-20">
          <View className="flex-col">
            <Pressable
              onPress={handleNext}
              className={`py-5 px-6 rounded-full bg-black`}
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

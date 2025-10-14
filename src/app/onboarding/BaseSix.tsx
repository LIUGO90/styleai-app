import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import DotsContainer from "@/components/dotsContainer";
import AsyncStorage from "@react-native-async-storage/async-storage";

const imagewidth = Dimensions.get("window").width * 0.4 > 180 ? 180 : Dimensions.get("window").width * 0.4;
export default function BaseSix() {
  const router = useRouter();
  const [name, setName] = useState<string>("");
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [image, setImage] = useState<string[]>([]);
  const [loadingImage1, setLoadingImage1] = useState(true);
  const [loadingImage2, setLoadingImage2] = useState(true);

  useEffect(() => {
    loadImagesUrl();
  }, []);
  const loadImagesUrl = async () => {
    const imagesUrl = await AsyncStorage.getItem("newlook");
    if (imagesUrl) {
      
      setImage(JSON.parse(imagesUrl) as string[]);
    }
  }

  const handleNext = async () => {
    // router.dismissAll();
    router.replace({
      pathname: "/tabs/home",
      params: { imagesUrls: JSON.stringify(image) }
    });
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

        <View className="flex-1 mb-2">
          <View
            className="flex-row justify-center px-2 gap-6 "
            style={{ height: 220 }}
          >
            {image.map((item, index) => (
              <View key={index} style={{ width: imagewidth }}
                className="overflow-hidden rounded-2xl"
              >
                <Image
                  source={{ uri: item }}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  onLoadStart={() => setLoadingImage1(true)}
                  onLoad={() => setLoadingImage1(false)}
                  style={{

                    width: imagewidth,
                    height: '120%',
                    // borderRadius: 12,
                    // backgroundColor: "#f0f0f0",
                  }}
                />
                {loadingImage1 && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      justifyContent: 'center',
                      alignItems: 'center',
                      // backgroundColor: 'rgba(0,0,0,0.1)',
                      borderRadius: 12,
                    }}
                  >
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text className="text-gray-600 mt-2 text-sm">Loading...</Text>
                  </View>
                )}
              </View>
            ))}

          </View>
        </View>

        <View className="flex-1 justify-center px-5 py-2">
          <Text className="text-2xl font-bold text-start mb-6 text-gray-800">
            Your Personalized Lookbook is ready. Unlock NOW!
          </Text>
          <Text className="text-sm font-bold text-start  text-gray-800">
            √ Find your personal style to dress confidently{"\n"}√ Get new
            outfit ideas of any item{"\n"}√ Elevate your everyday look{"\n"}
          </Text>
        </View>

        {/* <View className="flex-row justify-between h-40 px-5">
          <Pressable
            onPress={() => handlePlanSelect("monthly")}
            className={`flex-1 rounded-3xl border-2 h-40 mx-2 overflow-hidden ${selectedPlan === "monthly"
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
            className={`flex-1 rounded-3xl border-2 h-40 mx-2 relative ${selectedPlan === "quarterly"
              ? "border-orange-500 bg-orange-50"
              : "border-gray-300 bg-gray-300"
              }`}
            disabled={false}
          >

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
            className={`flex-1 rounded-3xl border-2 h-40 mx-2 relative ${selectedPlan === "yearly"
              ? "border-orange-500 bg-orange-50"
              : "border-gray-300 bg-gray-300"
              }`}
            disabled={false}
          >
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
        </View> */}

        <View className="p-5 mb-10">
          <View className="flex-row space-x-4">
            <Pressable
              onPress={handleNext}
              className={`flex-1 py-5 px-6 rounded-full bg-black `}
              disabled={false}
            >
              {/* <Text className={`text-center font-medium text-white`}>
                Start 3-days Free Trial
              </Text> */}
              <Text className={`text-center font-medium text-white`}>
                Continue to App
              </Text>
            </Pressable>
          </View>
        </View>

      </View>
    </View>
  );
}

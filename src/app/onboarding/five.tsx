import React, { useEffect, useState } from "react";
import DotsContainer from "@/components/dotsContainer";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { ImagePerformanceMonitor } from "@/components/ImagePerformanceMonitor";
import { OnboardingData } from "@/components/types";
import { aiRequestLookbook } from "@/services/aiReuest";
import { useAuth } from "@/contexts/AuthContext";
import { addImageLook } from "@/services/addLookBook";
import { supabase } from "@/utils/supabase";


export default function Five() {
  const { user } = useAuth();
  const STYLE_OPTIONS = [
    {
      id: "Casual",
      name: "Casual",
      url: require("../../../assets/onboarding/Style/Casual.png"),
    },
    {
      id: "Classy",
      name: "Classy",
      url: require("../../../assets/onboarding/Style/Classy.jpg"),
    },
    {
      id: "Old Money",
      name: "Old Money",
      url: require("../../../assets/onboarding/Style/OldMoney.png"),
    },
    {
      id: "Preppy",
      name: "Preppy",
      url: require("../../../assets/onboarding/Style/Preppy.png"),
    },
    {
      id: "Coastal",
      name: "Coastal",
      url: require("../../../assets/onboarding/Style/Coastal.png"),
    },
    {
      id: "Boho",
      name: "Boho",
      url: require("../../../assets/onboarding/Style/Boho.png"),
    },
    {
      id: "Coquette",
      name: "Coquette",
      url: require("../../../assets/onboarding/Style/Coquette.png"),
    },
    {
      id: "Edgy",
      name: "Edgy",
      url: require("../../../assets/onboarding/Style/Edgy.png"),
    },
    {
      id: "Sporty",
      name: "Sporty",
      url: require("../../../assets/onboarding/Style/Sporty.png"),
    },
    {
      id: "Streetstyle",
      name: "Streetstyle",
      url: require("../../../assets/onboarding/Style/Streetstyle.png"),
    },
    {
      id: "Dopamine",
      name: "Dopamine",
      url: require("../../../assets/onboarding/Style/Dopamine.png"),
    },
    {
      id: "Y2K",
      name: "Y2K",
      url: require("../../../assets/onboarding/Style/Y2K.png"),
    },
  ];

  const router = useRouter();
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [isUploading, setIsUploading] = useState<boolean>(false);
  useEffect(() => {
    const loadOnboardingData = async () => {
      const onboardingData = await AsyncStorage.getItem("onboardingData");
      if (onboardingData) {
        const onboardingDataObj = JSON.parse(onboardingData) as OnboardingData;
        if (onboardingDataObj.selectedStyles.length !== 0) {
          setSelectedStyles(onboardingDataObj.selectedStyles);
        }
      }
    };
    loadOnboardingData();
  });

  const handleStyleToggle = (styleId: string) => {
    setSelectedStyles((prev) => {
      if (prev.includes(styleId)) {
        return prev.filter((id) => id !== styleId);
      } else {
        return [...prev, styleId];
      }
    });
  };

  const handleNext = async () => {

    if (selectedStyles.length > 0) {
      setIsUploading(true);
      const onboardingData = await AsyncStorage.getItem("onboardingData");
      if (onboardingData) {
        const onboardingDataObj = JSON.parse(onboardingData) as OnboardingData;

        let imagesUrl: string[] = [];
        // for (let i = 0; i < 2; i++) {
        try {
          const resultLookbook = await aiRequestLookbook(user?.id || '', onboardingDataObj.fullBodyPhoto, selectedStyles.slice(0, 2), 1);
          // const resultLookbook = ["https://aft07xnw52tcy9ig.public.blob.vercel-storage.com/app/users/6a4465c8-1970-4398-a271-a747b8aff9a0/gemini_gemini_1760746610422_0.png", "https://aft07xnw52tcy9ig.public.blob.vercel-storage.com/app/users/6a4465c8-1970-4398-a271-a747b8aff9a0/gemini_gemini_1760746610652_1.png"];

          imagesUrl.push(...resultLookbook);
          addImageLook(user?.id || "", selectedStyles[0], imagesUrl.slice(0, 1));
          addImageLook(user?.id || "", selectedStyles[1], imagesUrl.slice(1, 2));

          // 尝试初始化用户积分账户
          if (user?.id) {
            await initializeUserCredits(user.id);
          }
          
        } catch (error) {
          // console.error(`Error generating ${i} lookbook:`, error);
        }
        await AsyncStorage.setItem(
          "newlook",
          JSON.stringify(imagesUrl),
        );

        console.log("🧐 执行更新数据库", imagesUrl);
        const { data, error } = await supabase.from('profiles').update({
          images: imagesUrl.join(','), // 转换为 JSON 字符串存储
        }).eq('id', user?.id || '');
        console.log("🧐 执行更新数据库响应", data, error);
        if (error) {
          console.error("❌ 更新数据库失败:", error);
        } else {
          console.log("✅ 更新数据库成功");
        }

        setIsUploading(false);
        router.push("/onboarding/BaseSix");
      }
    }

  };

  const handleImageError = (styleId: string) => {
    setImageErrors((prev) => new Set(prev).add(styleId));
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
        <DotsContainer activeIndex={5} indexNumber={6} />
      </View>
      <ScrollView>
        <View className="flex-1 justify-center px-5">
          <Text className="text-2xl font-bold text-gray-800 text-center mb-4">
            Select styles you like
          </Text>
          <Text className="text-gray-600 text-center mb-8">
            You can change it if it's not accurate
          </Text>

          {/* 风格选择网格 */}
          <View className="flex-row flex-wrap justify-between mb-8">
            {STYLE_OPTIONS.map((style) => {
              const isSelected = selectedStyles.includes(style.id);
              return (
                <Pressable
                  key={style.id}
                  onPress={() => handleStyleToggle(style.id)}
                  className={`w-[48%] max-w-[200px] mb-4 rounded-xl border-2 overflow-hidden ${isSelected
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-white"
                    }`}
                >
                  {/* 图片容器 */}
                  <View className="relative bg-gray-100 items-center justify-center">
                    <Image
                      source={style.url}
                      style={{
                        width: "100%",
                        maxWidth: 200,
                        height: 280,
                        flex: 1,
                      }}
                      contentFit="cover"
                    />
                    {/* 选中状态覆盖层 */}
                    {isSelected && (
                      <View className="absolute top-2 right-2">
                        <View className="bg-blue-500 rounded-full w-8 h-8 items-center justify-center shadow-lg">
                          <MaterialCommunityIcons
                            name="check"
                            size={20}
                            color="white"
                          />
                        </View>
                      </View>
                    )}
                  </View>

                  {/* 风格名称 */}
                  <View className="p-3">
                    <Text
                      className={`text-sm font-medium text-center ${isSelected ? "text-blue-600" : "text-gray-700"
                        }`}
                    >
                      {style.name}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* 选中的风格显示 */}
          {selectedStyles.length > 0 && (
            <View className="">
              <Text className="text-sm text-gray-600 ">
                Selected styles:
              </Text>
              <View className="flex-row flex-wrap">
                {selectedStyles.map((styleId) => {
                  const style = STYLE_OPTIONS.find((s) => s.id === styleId);
                  return (
                    <View
                      key={styleId}
                      className="bg-blue-100 rounded-full px-3 py-1 mr-2 mb-2"
                    >
                      <Text className="text-xs text-blue-600 font-medium">
                        {style?.name}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

        </View>
      </ScrollView>
      {/* 底部按钮 */}
      <View className="p-5 md-6">
        <View className="flex-col">
          {selectedStyles.length > 1 && !isUploading && (
            <Pressable
              onPress={handleNext}
              className={`my-2 py-5 px-6 rounded-full bg-black`}
              disabled={false}
            >
              <Text className={`text-center font-medium text-white`}>
                Continue
              </Text>
            </Pressable>
          )}

          {selectedStyles.length > 0 && isUploading && (
            <View className="my-2 py-5 px-6 rounded-full bg-gray-400 flex-row items-center justify-center">
              <MaterialCommunityIcons
                name="loading"
                size={20}
                color="white"
                style={{ marginRight: 8 }}
              />
              <Text className="text-center font-medium text-white">
                Uploading...
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
function initializeUserCredits(arg0: string) {
  throw new Error("Function not implemented.");
}


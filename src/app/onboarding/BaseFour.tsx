import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import DotsContainer from "@/components/dotsContainer";
import { getImagePath } from "@/config/imagePaths";
import { SafeAreaView } from "react-native-safe-area-context";


export default function BaseFour() {
  const { width: screenWidth } = Dimensions.get("window");

  const images = [
    { id: 1, source: getImagePath("SCROLL", "SCROLL_1") },
    { id: 2, source: getImagePath("SCROLL", "SCROLL_2") },
    { id: 3, source: getImagePath("SCROLL", "SCROLL_3") },
    // { id: 4, source: require('../../../assets/onboarding/BaseFour/4.png') },
    // { id: 5, source: require('../../../assets/onboarding/BaseFour/5.png') },
  ];
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  // 默认图片宽度为屏幕的3/5 (60%)
  const defaultImageWidth = screenWidth * 0.6 > 300 ? 300 : screenWidth * 0.6;
  const imageSpacing = 16;


  const handleNext = async () => {
    router.push("/onboarding/BaseFive");
  };

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(
      contentOffsetX / (defaultImageWidth + imageSpacing),
    );
    setCurrentIndex(index);
  };

  const scrollToIndex = (index: number) => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: index * (defaultImageWidth + imageSpacing),
        animated: true,
      });
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
        <View className="">
          <DotsContainer activeIndex={4} indexNumber={6} />
        </View>

        <View className="flex-1">
          <View className="justify-center px-5">
            <Text className="text-2xl font-bold text-start mb-8 text-gray-800">
              Got you! Styla totally understand your needs.
            </Text>

            {/* 横向滚动视图 - Before/After 图片展示 */}
            <View className="mb-6" style={{ height: 400 }}>
              <ScrollView
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                pagingEnabled={false}
                snapToInterval={defaultImageWidth + imageSpacing}
                snapToAlignment="start"
                decelerationRate="fast"
                scrollEventThrottle={16}
                onScroll={handleScroll}
                contentContainerStyle={{
                  paddingHorizontal: (screenWidth - defaultImageWidth) / 2,
                }}
              >
                {images.map((image, index) => {
                  return (
                    <View
                      key={image.id}
                      style={{
                        width: defaultImageWidth,
                        height: 380,
                        marginRight: index < images.length - 1 ? imageSpacing : 0,
                      }}
                    >
                      {/* 图片容器 */}
                      <View
                        className="rounded-2xl overflow-hidden "
                        style={{
                          width: defaultImageWidth,
                          height: 380,
                          // shadowColor: "#000",
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.15,
                          shadowRadius: 12,
                          elevation: 5,
                        }}
                      >
                        <Image
                          source={image.source}
                          style={{
                            width: defaultImageWidth,
                            height: 380,
                            borderRadius: 12,
                          }}
                          contentFit="cover"
                          cachePolicy="memory-disk"
                        />

                        {/* 水印 */}
                        <View className="absolute top-4 left-0 right-0">
                          <View className="flex-row justify-around px-4">
                            <View className="bg-black/60 rounded-full px-4 py-1.5">
                              <Text className="text-white text-sm font-semibold">
                                Before
                              </Text>
                            </View>
                            <View className="bg-black/60 rounded-full px-4 py-1.5">
                              <Text className="text-white text-sm font-semibold">
                                After
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>

              {/* 当前索引显示 */}
              <Text className="text-center text-sm text-gray-500 mt-4">
                {currentIndex + 1} / {images.length}
              </Text>
            </View>

            <Text className="text-base text-start mb-8 text-gray-700 leading-6">
              Over 90% of Styla users dress more confident after discovering
              fresh outfit ideas, elevating their everyday looks, and unveiling
              colors and silhouettes that truly flatter them.
              {"\n\n"}
              <Text className="font-bold text-gray-800">Are you ready to glow up?</Text>
            </Text>
          </View>
        </View>

        <View className="p-5 mb-8">
          <Pressable
            onPress={handleNext}
            className="py-5 px-6 rounded-full bg-black"
          >
            <Text className="text-center font-semibold text-white text-lg">
              Yes! Let's do this
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

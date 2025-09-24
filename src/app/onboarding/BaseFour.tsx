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
import {
  getImageDimensions,
  calculateFitDimensions,
} from "@/utils/imageDimensions";

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
  const [imageDimensions, setImageDimensions] = useState<{
    [key: number]: { width: number; height: number };
  }>({});

  // 默认图片宽度为屏幕的3/5 (60%)
  const defaultImageWidth = screenWidth * 0.6;
  const imageSpacing = 16;

  useEffect(() => {
    const loadOnboardingData = async () => {
      // 预加载图片尺寸
      const dimensions: { [key: number]: { width: number; height: number } } =
        {};
      for (const image of images) {
        try {
          const dims = await getImageDimensions(image.source);
          // 计算适合显示的尺寸
          const fitDims = calculateFitDimensions(
            dims,
            defaultImageWidth,
            defaultImageWidth * 1.2,
          );
          dimensions[image.id] = {
            width: fitDims.width,
            height: fitDims.height,
          };
        } catch (error) {
          console.log("Failed to get dimensions for image:", image.id, error);
          // 使用默认尺寸
          dimensions[image.id] = {
            width: defaultImageWidth,
            height: defaultImageWidth * 0.75,
          };
        }
      }
      setImageDimensions(dimensions);
    };
    loadOnboardingData();
  }, []);

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

  // 获取图片显示尺寸
  const getImageDisplaySize = (imageId: number) => {
    const dims = imageDimensions[imageId];
    if (!dims) {
      return { width: defaultImageWidth, height: defaultImageWidth * 0.75 };
    }
    return dims;
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
          <DotsContainer activeIndex={4} indexNumber={6} />
        </View>
        <ScrollView>
          <View className="flex-1 justify-center px-5">
            <Text className="text-2xl font-bold text-start mb-8 text-gray-800">
              Got you! Styla totally understand your needs.
            </Text>

            {/* 横向滚动视图 - 动态尺寸图片显示 */}
            <View className="mb-6">
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
                  const displaySize = getImageDisplaySize(image.id);
                  return (
                    <View
                      key={image.id}
                      className="relative"
                      style={{
                        width: displaySize.width,
                        marginRight:
                          index < images.length - 1 ? imageSpacing : 0,
                      }}
                    >
                      {/* 图片容器 */}
                      <View
                        className="rounded-xl overflow-hidden shadow-md"
                        style={{
                          width: displaySize.width,
                          height: displaySize.height,
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.1,
                          shadowRadius: 4,
                          elevation: 3,
                        }}
                      >
                        <Image
                          source={image.source}
                          style={StyleSheet.absoluteFillObject}
                          contentFit="cover"
                          cachePolicy="memory-disk"
                        />

                        {/* 水印 */}
                        <View className="absolute inset-0 ">
                          <View className="bg-opacity-60 rounded-lg px-3 py-1 flex-row justify-around">
                            <Text className="text-white text-sm font-bold text-center">
                              Before
                            </Text>
                            <Text className="text-white text-sm font-bold text-center">
                              After
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>

              {/* 当前索引显示 */}
              <Text className="text-center text-sm text-gray-500 mt-2">
                {currentIndex + 1} / {images.length}
              </Text>
            </View>

            <Text className="text-base font-bold text-start mb-8 text-gray-800">
              Over 90% of Styla users dress more confident after discovering
              fresh outfit ideas, elevating their everyday looks, and unveiling
              colors and silhouettes that truly flatter them.
              {"\n\n"}
              Are you ready to glow up?
            </Text>
          </View>
        </ScrollView>
        <View className="p-5 my-10">
          <View className="flex-row space-x-4">
            <Pressable
              onPress={handleNext}
              className={`flex-1 py-5 px-6 rounded-full bg-black`}
            >
              <Text className={`text-center font-medium text-white`}>
                Yes! Let’s do this
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

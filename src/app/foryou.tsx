import React, { useState, useRef, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, TouchableOpacity, Dimensions, StyleSheet, Alert, FlatList, ViewToken, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { OnboardingData } from "@/components/types";
import { aiRequestForYou, aiRequestLookbook } from "@/services/aiReuest";
import { useAuth } from "@/contexts/AuthContext";
import { LookbookService } from "@/services/LookbookService";
import { useCallback } from "react";
import { incrementBadge } from "@/utils/badgeManager";
import { Toast } from "@/components/Toast";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const foryou = [
    {
        name: "Old Money",
        urls: [
            "https://aft07xnw52tcy9ig.public.blob.vercel-storage.com/app/lookbook/OldMoney/image_001.png",
            "https://aft07xnw52tcy9ig.public.blob.vercel-storage.com/app/lookbook/OldMoney/image_002.png",
            "https://aft07xnw52tcy9ig.public.blob.vercel-storage.com/app/lookbook/OldMoney/image_003.png",
            "https://aft07xnw52tcy9ig.public.blob.vercel-storage.com/app/lookbook/OldMoney/image_004.png",
            "https://aft07xnw52tcy9ig.public.blob.vercel-storage.com/app/lookbook/OldMoney/image_005.png",
        ],
        post: [
            "https://aft07xnw52tcy9ig.public.blob.vercel-storage.com/app/lookbook/OldMoney/post_001.png",
            "https://aft07xnw52tcy9ig.public.blob.vercel-storage.com/app/lookbook/OldMoney/post_002.png",
            "https://aft07xnw52tcy9ig.public.blob.vercel-storage.com/app/lookbook/OldMoney/post_003.png",
            "https://aft07xnw52tcy9ig.public.blob.vercel-storage.com/app/lookbook/OldMoney/post_004.png",
            "https://aft07xnw52tcy9ig.public.blob.vercel-storage.com/app/lookbook/OldMoney/post_005.png",
        ],
        prompt: [
            "Full-body fashion editorial photography of the woman in the first image wearing the outfit in the second image. She stands elegantly with a composed and stylish posture. Gentle smile on her face. The background is a luxury private estate with lush gardens and marble columns. The overall mood is polished, blending classic old-money elegance with a chic attitude.Shot with a 50mm lens at f/1.8.",
            "Full-body fashion editorial photography of the woman in the first image wearing the outfit in the second image.The model stands elegantly with a composed and stylish posture. Gentle smile on her face. The background is a luxury private estate with lush gardens and marble columns. The overall mood is polished, blending classic old-money elegance with a chic attitude.Shot with a 50mm lens at f/1.8.",
            "Full-body fashion editorial photography of the woman in the first image wearing the outfit in the second image.The model stands elegantly with a composed and stylish posture. Gentle smile on her face. The background is a luxury private estate with lush gardens and marble columns. The overall mood is polished, blending classic old-money elegance with a chic attitude.Shot with a 50mm lens at f/1.8.",
            "Full-body fashion editorial photography of the woman in the first image wearing the outfit in the second image.The model stands elegantly with a composed and stylish posture. Gentle smile on her face. The background is a luxury private estate with lush gardens and marble columns. The overall mood is polished, blending classic old-money elegance with a chic attitude.Shot with a 50mm lens at f/1.8.",
            "Full-body fashion editorial photography of the woman in the first image wearing the outfit in the second image.The model stands elegantly with a composed and stylish posture. Gentle smile on her face. The background is a luxury private estate with lush gardens and marble columns. The overall mood is polished, blending classic old-money elegance with a chic attitude.Shot with a 50mm lens at f/1.8.",
        ],

    },
    {
        name: "Y2K",
        urls: [
            "https://aft07xnw52tcy9ig.public.blob.vercel-storage.com/app/lookbook/Y2K/2025_001.png",
            "https://aft07xnw52tcy9ig.public.blob.vercel-storage.com/app/lookbook/Y2K/2025_002.png",
            "https://aft07xnw52tcy9ig.public.blob.vercel-storage.com/app/lookbook/Y2K/2025_003.png",
            "https://aft07xnw52tcy9ig.public.blob.vercel-storage.com/app/lookbook/Y2K/2025_004.png",
            "https://aft07xnw52tcy9ig.public.blob.vercel-storage.com/app/lookbook/Y2K/2025_005.png",
        ],
        post: [
            "https://aft07xnw52tcy9ig.public.blob.vercel-storage.com/app/lookbook/Y2K/2025_001.png",
            "https://aft07xnw52tcy9ig.public.blob.vercel-storage.com/app/lookbook/Y2K/2025_002.png",
            "https://aft07xnw52tcy9ig.public.blob.vercel-storage.com/app/lookbook/Y2K/2025_003.png",
            "https://aft07xnw52tcy9ig.public.blob.vercel-storage.com/app/lookbook/Y2K/2025_004.png",
            "https://aft07xnw52tcy9ig.public.blob.vercel-storage.com/app/lookbook/Y2K/2025_005.png",
        ],
        prompt: [
            "Full-body Y2K fashion editorial photography of the woman in the first image wearing the outfit in the second image. She stands with a chic and cool-girl posture. The background is New York Time Square. The overall mood is chic and edgy. Shot with a 50mm lens at f/1.8.",
            "Full-body Y2K fashion editorial photography of the woman in the first image wearing the outfit in the second image. She stands with a chic and cool-girl posture. The background is New York Time Square. The overall mood is chic and edgy. Shot with a 50mm lens at f/1.8.",
            "Full-body Y2K fashion editorial photography of the woman in the first image wearing the outfit in the second image. She stands with a chic and cool-girl posture. The background is New York Time Square. The overall mood is chic and edgy. Shot with a 50mm lens at f/1.8.",
            "Full-body Y2K fashion editorial photography of the woman in the first image wearing the outfit in the second image. She stands with a chic and cool-girl posture. The background is New York Time Square. The overall mood is chic and edgy. Shot with a 50mm lens at f/1.8.",
            "Full-body Y2K fashion editorial photography of the woman in the first image wearing the outfit in the second image. She stands with a chic and cool-girl posture. The background is New York Time Square. The overall mood is chic and edgy. Shot with a 50mm lens at f/1.8.",
        ],
    },
    {
        name: "BurgundyFall",
        urls: [
            "https://aft07xnw52tcy9ig.public.blob.vercel-storage.com/app/lookbook/BurgundyFall/image_001.png",
            "https://aft07xnw52tcy9ig.public.blob.vercel-storage.com/app/lookbook/BurgundyFall/image_002.png",
            "https://aft07xnw52tcy9ig.public.blob.vercel-storage.com/app/lookbook/BurgundyFall/image_003.png",
            "https://aft07xnw52tcy9ig.public.blob.vercel-storage.com/app/lookbook/BurgundyFall/image_004.png",
            "https://aft07xnw52tcy9ig.public.blob.vercel-storage.com/app/lookbook/BurgundyFall/image_005.png",
            "https://aft07xnw52tcy9ig.public.blob.vercel-storage.com/app/lookbook/BurgundyFall/image_006.png",
            "https://aft07xnw52tcy9ig.public.blob.vercel-storage.com/app/lookbook/BurgundyFall/image_007.png",
            "https://aft07xnw52tcy9ig.public.blob.vercel-storage.com/app/lookbook/BurgundyFall/image_008.png",
        ],
        post: [
            "https://aft07xnw52tcy9ig.public.blob.vercel-storage.com/app/lookbook/BurgundyFall/post_001.png",
            "https://aft07xnw52tcy9ig.public.blob.vercel-storage.com/app/lookbook/BurgundyFall/post_002.png",
            "https://aft07xnw52tcy9ig.public.blob.vercel-storage.com/app/lookbook/BurgundyFall/post_003.png",
            "https://aft07xnw52tcy9ig.public.blob.vercel-storage.com/app/lookbook/BurgundyFall/post_004.png",
            "https://aft07xnw52tcy9ig.public.blob.vercel-storage.com/app/lookbook/BurgundyFall/post_005.png",
            "https://aft07xnw52tcy9ig.public.blob.vercel-storage.com/app/lookbook/BurgundyFall/post_006.png",
            "https://aft07xnw52tcy9ig.public.blob.vercel-storage.com/app/lookbook/BurgundyFall/post_007.png",
            "https://aft07xnw52tcy9ig.public.blob.vercel-storage.com/app/lookbook/BurgundyFall/post_008.png",
        ],
        prompt: [
            "Full-body fashion editorial photography of the woman in the first image wearing the outfit in the second image. She stands elegantly with a composed and stylish posture. Gentle smile on her face. The background is an elegant European palace courtyard with stone architecture. The overall mood is polished, blending classic old-money elegance with a chic attitude.Shot with a 50mm lens at f/1.8.",
            "Full-body fashion editorial photography of the woman in the first image wearing the outfit in the second image. She stands elegantly with a composed and stylish posture. Gentle smile on her face. The background is an elegant European palace courtyard with stone architecture. The overall mood is polished, blending classic old-money elegance with a chic attitude.Shot with a 50mm lens at f/1.8.",
            "Full-body fashion editorial photography of the woman in the first image wearing the outfit in the second image. She stands elegantly with a composed and stylish posture. Gentle smile on her face. The background is an elegant European palace courtyard with stone architecture. The overall mood is polished, blending classic old-money elegance with a chic attitude.Shot with a 50mm lens at f/1.8.",
            "Full-body fashion editorial photography of the woman in the first image wearing the outfit in the second image. She stands elegantly with a composed and stylish posture. Gentle smile on her face. The background is an elegant European palace courtyard with stone architecture. The overall mood is polished, blending classic old-money elegance with a chic attitude.Shot with a 50mm lens at f/1.8.",
            "Full-body fashion editorial photography of the woman in the first image wearing the outfit in the second image. She stands elegantly with a composed and stylish posture. Gentle smile on her face. The background is an elegant European palace courtyard with stone architecture. The overall mood is polished, blending classic old-money elegance with a chic attitude.Shot with a 50mm lens at f/1.8.",
            "Full-body fashion editorial photography of the woman in the first image wearing the outfit in the second image. She stands elegantly with a composed and stylish posture. Gentle smile on her face. The background is an elegant European palace courtyard with stone architecture. The overall mood is polished, blending classic old-money elegance with a chic attitude.Shot with a 50mm lens at f/1.8.",
            "Full-body fashion editorial photography of the woman in the first image wearing the outfit in the second image. She stands elegantly with a composed and stylish posture. Gentle smile on her face. The background is an elegant European palace courtyard with stone architecture. The overall mood is polished, blending classic old-money elegance with a chic attitude.Shot with a 50mm lens at f/1.8.",
            "Full-body fashion editorial photography of the woman in the first image wearing the outfit in the second image. She stands elegantly with a composed and stylish posture. Gentle smile on her face. The background is an elegant European palace courtyard with stone architecture. The overall mood is polished, blending classic old-money elegance with a chic attitude.Shot with a 50mm lens at f/1.8.",
        ],
    },

];
export default function ForYouScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const params = useLocalSearchParams();
    const flatListRef = useRef<FlatList>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [reloadKey, setReloadKey] = useState(0);
    
    // Toast 状态
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error' | 'info' | 'warning'>('success');
    const [toastAction, setToastAction] = useState<{ label: string; onPress: () => void } | undefined>();
    
    // 加载状态
    const [isGenerating, setIsGenerating] = useState(false);

    // 解析传递过来的图片数据
    const imageData = params.image ? JSON.parse(params.image as string) : null;

    // 使用多张图片 URL
    const selectedImageData = foryou.find(item => item.name === imageData.name);
    const images = selectedImageData?.post || [];
    const imagesurl = selectedImageData?.urls || [];

    // 显示 Toast 的辅助函数
    const showToast = (
        message: string, 
        type: 'success' | 'error' | 'info' | 'warning' = 'success',
        action?: { label: string; onPress: () => void }
    ) => {
        setToastMessage(message);
        setToastType(type);
        setToastAction(action);
        setToastVisible(true);
    };

    // 每次页面获得焦点时强制重载
    useFocusEffect(
        useCallback(() => {
            setReloadKey(prev => prev + 1);
            setCurrentIndex(0);
            // 延迟滚动，确保 FlatList 已渲染
            setTimeout(() => {
                flatListRef.current?.scrollToIndex({ index: 0, animated: false });
            }, 100);
        }, [])
    );

    if (!imageData) {
        return (
            <SafeAreaView className="flex-1 bg-white">
                <View className="flex-1 justify-center items-center">
                    <Text className="text-gray-800 text-lg">No image available</Text>
                </View>
            </SafeAreaView>
        );
    }

    // 处理滑动时的页面变化
    const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
        if (viewableItems.length > 0 && viewableItems[0].index !== null) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;

    const handleNext = async () => {
        try {
            // 获取当前显示的图片 URL
            const currentImageUrl = imagesurl[currentIndex];
            const prompt = selectedImageData?.prompt[currentIndex] || "";

            const onboardingData = await AsyncStorage.getItem("onboardingData") || "{}";
            const onboardingDataObj = JSON.parse(onboardingData) as OnboardingData;
            const imageUrl = onboardingDataObj.fullBodyPhoto;

            if (!imageUrl) {
                showToast("Please complete onboarding first", "error");
                return;
            }
            const selectedStyles = imageData.name;

            // 显示加载状态
            setIsGenerating(true);
            showToast("Creating your personalized lookbook...", "info");

            let imagesUrl: string[] = [];
            // 只使用当前选中的图片
            const resultLookbook = await aiRequestForYou(user?.id || '', [imageUrl, currentImageUrl], prompt);

            if (resultLookbook && resultLookbook.length > 0) {
                imagesUrl.push(resultLookbook[0]);
            }

            if (imagesUrl && imagesUrl.length > 0) {

                // 获取或创建默认相册集合
                const defaultCollection = await LookbookService.getOrCreateDefaultCollection(user?.id || '');

                // 保存生成的图片到相册
                const savedItem = await LookbookService.addLookbookItem(
                    defaultCollection.id,
                    selectedStyles,
                    imagesUrl,
                    user?.id || '',
                    `${selectedStyles} Lookbook`,
                    `Generated ${imagesUrl.length} outfit images in ${selectedStyles} style`
                );

                // 增加 Lookbook 徽章计数
                await incrementBadge('lookbook');

                // 显示成功消息
                showToast(
                    `Your ${selectedStyles} lookbook has been saved!`,
                    "success",
                    {
                        label: "View",
                        onPress: () => {
                            router.replace("/tabs/lookbook/one");
                        }
                    }
                );

            } else {
                console.error('❌ No images generated - imagesUrl is empty or null');
                showToast("Failed to generate lookbook images", "error");
            }
        } catch (error) {
            console.error("Error generating lookbook:", error);
            showToast("Failed to generate lookbook. Please try again.", "error");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Toast 通知 */}
            <Toast
                visible={toastVisible}
                message={toastMessage}
                type={toastType}
                action={toastAction}
                onHide={() => {
                    setToastVisible(false);
                    setToastAction(undefined);
                }}
            />
            
            {/* Header */}
            <View className="absolute top-10 left-0 right-0 z-12 flex-row justify-between items-center px-4 py-3 bg-white/95 backdrop-blur-sm border-b border-gray-200">
                <TouchableOpacity
                    onPress={() => {
                        if (router.canGoBack()) {
                            router.back();
                        } else {
                            router.replace('/tabs/home');
                        }
                    }}
                    className="p-2 -ml-2"
                    activeOpacity={0.7}
                >
                    <MaterialCommunityIcons name="arrow-left" size={28} color="#000" />
                </TouchableOpacity>
                <View className="flex-1 items-center">
                    <Text className="text-gray-800 text-lg font-semibold">
                        {imageData.name}
                    </Text>
                    <Text className="text-gray-500 text-xs mt-1">
                        {currentIndex + 1} / {images.length}
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={() => {
                        if (router.canGoBack()) {
                            router.back();
                        } else {
                            router.replace('/tabs/home');
                        }
                    }}
                    className="p-2 -mr-2"
                    activeOpacity={0.7}
                >
                    <MaterialCommunityIcons name="close" size={24} color="#000" />
                </TouchableOpacity>
            </View>

            {/* 水平滑动图片列表 */}
            <View className="flex-1 bg-gray-50 mt-8" key={`container-${reloadKey}`}>
                <FlatList
                    ref={flatListRef}
                    data={images}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={{
                        itemVisiblePercentThreshold: 50
                    }}
                    keyExtractor={(item, index) => `image-${index}-${reloadKey}`}
                    renderItem={({ item, index }) => (
                        <View style={styles.imageContainer}>
                            <Image
                                source={{ uri: item }}
                                style={styles.mainImage}
                                contentFit="contain"
                                placeholder="Loading..."
                                cachePolicy="memory-disk"
                                priority="high"
                                recyclingKey={`foryou-${index}-${reloadKey}`}
                            />
                        </View>
                    )}
                    extraData={reloadKey}
                />

                {/* 页面指示器（圆点） */}
                <View className="absolute bottom-8 left-0 right-0 flex-row justify-center items-center">
                    {images.map((_, index) => (
                        <TouchableOpacity
                            key={index}
                            onPress={() => {
                                flatListRef.current?.scrollToIndex({ index, animated: true });
                            }}
                            className="mx-1"
                        >
                            <View
                                className={`h-2 rounded-full transition-all ${index === currentIndex
                                    ? 'w-8 bg-black'
                                    : 'w-2 bg-gray-400'
                                    }`}
                            />
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Bottom Info Card */}
            <View className="bg-white border-t border-gray-200 p-6 mx-2 rounded-3xl shadow-lg">
                <View className="items-center">
                    {/* 显示当前选择的图片信息 */}
                    <View className="bg-gray-100 px-4 py-2 rounded-full mb-4">
                        <Text className="text-gray-600 text-sm">
                            Selected Look {currentIndex + 1} of {images.length}
                        </Text>
                    </View>

                    <TouchableOpacity
                        className="bg-black w-full py-4 rounded-xl"
                        activeOpacity={0.8}
                        onPress={handleNext}
                        disabled={isGenerating}
                        style={{ opacity: isGenerating ? 0.6 : 1 }}
                    >
                        <View className="flex-row items-center justify-center">
                            {isGenerating ? (
                                <>
                                    <ActivityIndicator size="small" color="#ffffff" />
                                    <Text className="text-white text-lg font-semibold ml-2">
                                        Generating...
                                    </Text>
                                </>
                            ) : (
                                <>
                                    <MaterialCommunityIcons name="shimmer" size={20} color="#ffffff" />
                                    <Text className="text-white text-lg font-semibold ml-2">
                                        Try On This Look
                                    </Text>
                                </>
                            )}
                        </View>
                    </TouchableOpacity>

                    {/* 提示文字 */}
                    <Text className="text-gray-500 text-xs text-center mt-3">
                        Swipe to explore different looks
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    imageContainer: {
        width: SCREEN_WIDTH,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mainImage: {
        width: SCREEN_WIDTH * 0.9,
        aspectRatio: 712 / 1247,  // 使用实际图片的宽高比
        maxHeight: SCREEN_HEIGHT * 0.65,  // 最大高度限制
    },
});
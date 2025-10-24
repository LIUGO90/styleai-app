import React, { useState, useRef, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, TouchableOpacity, Dimensions, StyleSheet, Alert, FlatList, ViewToken, ActivityIndicator, RefreshControl } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { OnboardingData } from "@/components/types";
import { aiRequestForYou, aiRequestLookbook } from "@/services/aiReuest";
import { persistentAIService } from "@/services/PersistentAIService";
import { useAuth } from "@/contexts/AuthContext";
import { useCallback } from "react";
import { incrementBadge } from "@/utils/badgeManager";
import { addImageLook } from "@/services/addLookBook";
import { StyleTemplateService } from "@/services/StyleTemplateService";
import { StyleTemplate } from "@/types/styleTemplate.types";
import { useTemplateGenerationStore } from "@/stores/templateGenerationStore";
import { useGlobalToast } from "@/utils/globalToast";
import { usePersistentRequests } from "@/hooks/usePersistentRequests";
import { useCredits } from "@/hooks/usePayment";
import { useCredit } from "@/contexts/CreditContext";
import paymentService from "@/services/PaymentService";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ForYouScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const params = useLocalSearchParams();
    const flatListRef = useRef<FlatList>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [reloadKey, setReloadKey] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    
    // 积分相关状态
    const { credits, loading: creditsLoading, refresh: refreshCredits } = useCredits();
    const { showCreditModal } = useCredit();

    // 使用全局 Toast
    const { showToast } = useGlobalToast();

    // 使用 Zustand store 管理每个 template 的生成状态
    const { setGenerating, isGenerating: isTemplateGenerating, clearAll } = useTemplateGenerationStore();

    // 解析传递过来的图片数据
    const imageData = params.image ? JSON.parse(params.image as string) : null;

    const [foryou, setForyou] = useState<StyleTemplate[]>([]);

    // 使用持久化请求 Hook（启用自动恢复）
    const { pendingRequests, isRestoring, isInitialized, setAutoRestore } = usePersistentRequests({
        autoRestore: true, // 启用自动恢复
        onRequestRestored: (request) => {
            console.log('🔄 [ForYou] 请求正在恢复:', request);
            showToast({ 
                message: "Restoring interrupted request...", 
                type: "info" 
            });
        }
    });

    // 加载模板数据的函数
    const loadTemplates = async () => {
        if (imageData?.name) {
            try {
                const templates = await StyleTemplateService.getTemplateByName(imageData.name);
                console.log(`✅ [ForYou] 获取到 ${templates?.length || 0} 个 ${imageData.name} 模板`);

                if (templates && templates.length > 0) {
                    setForyou(templates);
                    setCurrentIndex(0);

                    // 确保数据设置后再滚动
                    setTimeout(() => {
                        if (templates.length > 0) {
                            flatListRef.current?.scrollToIndex({ index: 0, animated: false });
                        }
                    }, 200);
                }
            } catch (error) {
                console.error('❌ [ForYou] 加载模板失败:', error);
            }
        }
    };

    // 手动刷新函数
    const onRefresh = async () => {
        setRefreshing(true);
        setForyou([]);
        setReloadKey(prev => prev + 1);
        await loadTemplates();
        setRefreshing(false);
    };

    // 每次页面获得焦点时强制重载
    useFocusEffect(
        useCallback(() => {
            // 清除所有之前的生成状态
            clearAll();
            setForyou([]);
            setReloadKey(prev => prev + 1);
            loadTemplates();
        }, [imageData?.name])
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
            // 安全检查：确保攒据已加载
            if (!foryou || foryou.length === 0) {
                showToast({ message: "Loading templates, please wait...", type: "info" });
                return;
            }

            if (currentIndex >= foryou.length) {
                showToast({ message: "Invalid selection", type: "error" });
                return;
            }

            // 获取当前显示的模板数据
            const currentTemplate = foryou[currentIndex];
            const currentTemplateId = currentTemplate.id;
            const currentImageUrl = currentTemplate.urls;  // 使用 urls 作为参考图
            const prompt = currentTemplate.prompt;

            // 检查当前 template 是否正在生成
            if (isTemplateGenerating(currentTemplateId)) {
                showToast({ message: "This look is already being generated...", type: "info" });
                return;
            }

            // 检查用户积分
            const requiredCredits = 10;
            const availableCredits = credits?.available_credits || 0;
            
            if (availableCredits < requiredCredits) {
                showToast({ 
                    message: `需要 ${requiredCredits} 积分才能生成图片，当前积分不足`, 
                    type: "warning",
                    duration: 3000
                });
                
                // 延迟显示积分购买弹窗，让用户看到提示信息
                setTimeout(() => {
                    showCreditModal();
                }, 1500);
                return;
            }

            const onboardingData = await AsyncStorage.getItem("onboardingData") || "{}";
            const onboardingDataObj = JSON.parse(onboardingData) as OnboardingData;
            const imageUrl = onboardingDataObj.fullBodyPhoto;

            if (!imageUrl) {
                showToast({ message: "Please complete onboarding first", type: "error" });
                return;
            }
            const selectedStyles = imageData.name;

            // 设置当前 template 的加载状态
            setGenerating(currentTemplateId, true);
            showToast({ message: "Creating your personalized lookbook...", type: "info" });

            // 使用持久化 AI 服务发起请求，支持中断恢复
            const resultLookbook = await persistentAIService.requestForYou(
                user?.id || '', 
                [imageUrl, currentImageUrl], 
                prompt,
                {
                    onProgress: (progress) => {
                        console.log(`📊 生成进度: ${progress}%`);
                    }
                }
            );

            if (resultLookbook && resultLookbook.length > 0) {
                // 图片生成成功，扣除积分
                try {
                    const deductSuccess = await paymentService.useCredits(
                        user?.id || '',
                        requiredCredits,
                        'image_generation',
                        currentTemplateId,
                        `Generated ${selectedStyles} lookbook`
                    );

                    if (deductSuccess) {
                        console.log(`✅ [ForYou] 成功扣除 ${requiredCredits} 积分`);
                        // 刷新积分信息
                        await refreshCredits();
                    } else {
                        console.warn('⚠️ [ForYou] 积分扣除失败，但图片已生成');
                    }
                } catch (creditError) {
                    console.error('❌ [ForYou] 积分扣除异常:', creditError);
                }

                // 显示成功消息
                showToast({
                    message: `Your ${selectedStyles} lookbook has been saved!`,
                    type: "success",
                    action: {
                        label: "View",
                        onPress: () => {
                            router.replace("/tabs/lookbook");
                        }
                    }
                });

            } else {
                console.error('❌ No images generated - imagesUrl is empty or null');
                showToast({ message: "Failed to generate lookbook images", type: "error" });
            }
        } catch (error) {
            console.error("Error generating lookbook:", error);
            showToast({ 
                message: "Request interrupted. It will be restored automatically when you reopen the app.", 
                type: "warning",
                duration: 5000
            });
        } finally {
            // 清除当前 template 的加载状态
            if (foryou[currentIndex]) {
                setGenerating(foryou[currentIndex].id, false);
            }
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Header */}
            <View className="left-0 right-0 flex-row justify-between items-center px-4 bg-white/95 backdrop-blur-sm border-b border-gray-200">
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
                        {currentIndex + 1} / {foryou.length}
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={onRefresh}
                    className="p-2 -mr-2"
                    activeOpacity={0.7}
                    disabled={refreshing}
                >
                    <MaterialCommunityIcons 
                        name="refresh" 
                        size={24} 
                        color={refreshing ? "#999" : "#000"} 
                    />
                </TouchableOpacity>
            </View>

            {/* 水平滑动图片列表 */}
            <View className="min-h-[200px] bg-gray-50 mt-1" key={`container-${reloadKey}`}>
                {foryou.length === 0 ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator size="large" color="#000" />
                        <Text className="text-gray-500 mt-4">Loading templates...</Text>
                    </View>
                ) : (
                    <>
                        <FlatList
                            ref={flatListRef}
                            data={foryou}
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            onViewableItemsChanged={onViewableItemsChanged}
                            viewabilityConfig={{
                                itemVisiblePercentThreshold: 50
                            }}
                            keyExtractor={(item, index) => `image-${item.id}-${index}-${reloadKey}`}
                            renderItem={({ item, index }) => (
                                <View style={styles.imageContainer}>
                                    <Image
                                        source={{ uri: item.post }}
                                        style={styles.mainImage}
                                        contentFit="cover"
                                        placeholder="Loading..."
                                        cachePolicy="memory-disk"
                                        priority="high"
                                        recyclingKey={`foryou-${item.id}-${index}-${reloadKey}`}
                                    />
                                </View>
                            )}
                            extraData={reloadKey}
                        />

                        {/* 页面指示器（圆点） */}
                        {foryou.length > 0 && (
                            <View className="absolute bottom-8 left-0 right-0 flex-row justify-center items-center">
                                {foryou.map((_, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        onPress={() => {
                                            flatListRef.current?.scrollToIndex({ index, animated: true });
                                        }}
                                        className="mx-1"
                                    >
                                        <View
                                            style={[
                                                styles.indicator,
                                                index === currentIndex ? styles.indicatorActive : styles.indicatorInactive
                                            ]}
                                        />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </>
                )}

            </View>

            {/* Bottom Info Card */}
            <View className="bg-white border-t border-gray-200 p-2 mx-2 rounded-3xl shadow-lg">
                <View className="items-center">
                    {/* 显示当前选择的图片信息 */}
                    <View className="bg-gray-100 px-4 py-2 rounded-full mb-4">
                        <Text className="text-gray-600 text-sm">
                            Selected Look {currentIndex + 1} of {foryou.length}
                        </Text>
                    </View>

                    <TouchableOpacity
                        className="bg-black w-full py-4 rounded-xl"
                        activeOpacity={0.8}
                        onPress={handleNext}
                        disabled={
                            foryou.length === 0 || 
                            (foryou[currentIndex] && isTemplateGenerating(foryou[currentIndex].id))
                        }
                        style={{ 
                            opacity: (
                                foryou.length === 0 || 
                                (foryou[currentIndex] && isTemplateGenerating(foryou[currentIndex].id))
                            ) ? 0.6 : 1 
                        }}
                    >
                        <View className="flex-row items-center justify-center">
                            {foryou[currentIndex] && isTemplateGenerating(foryou[currentIndex].id) ? (
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
        // width: SCREEN_WIDTH * 0.8,
        height: SCREEN_HEIGHT * 0.65,
        aspectRatio: 712 / 1247,  // 使用实际图片的宽高比
        maxHeight: SCREEN_HEIGHT * 0.65,  // 最大高度限制
        borderRadius: 16,
        overflow: 'hidden',
    },
    indicator: {
        height: 8,
        borderRadius: 4,
    },
    indicatorActive: {
        width: 32,
        backgroundColor: '#000000',
    },
    indicatorInactive: {
        width: 8,
        backgroundColor: '#9CA3AF',
    },
});
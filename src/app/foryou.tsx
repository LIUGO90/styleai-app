import React, { useState, useRef, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, TouchableOpacity, Dimensions, StyleSheet, Alert, FlatList, ViewToken, ActivityIndicator, RefreshControl, Share } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { OnboardingData } from "@/components/types";
import { aiRequestForYou, aiRequestLookbook } from "@/services/aiReuest";
import { generateRequestId, persistentAIService } from "@/services/PersistentAIService";
import { useAuth } from "@/contexts/AuthContext";
import { useCallback } from "react";
import { incrementBadge } from "@/utils/badgeManager";
import { addImageLook } from "@/services/addLookBook";
import { StyleTemplateService } from "@/services/StyleTemplateService";
import { StyleTemplate } from "@/types/styleTemplate.types";
import { ShopLookService, ShopLook } from "@/services/ShopLookService";
import { useTemplateGenerationStore } from "@/stores/templateGenerationStore";
import { useGlobalToast } from "@/utils/globalToast";
import { usePersistentRequests } from "@/hooks/usePersistentRequests";
import { useCredit } from "@/contexts/CreditContext";
import paymentService from "@/services/PaymentService";
import { supabase } from "@/utils/supabase";
import { analytics } from "@/services/AnalyticsService";
import { shadowStyles } from "@/utils/shadow";
import { ScrollView } from "react-native-gesture-handler";
import * as Linking from "expo-linking";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ForYouScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const params = useLocalSearchParams();
    const flatListRef = useRef<FlatList>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [reloadKey, setReloadKey] = useState(0);
    const [refreshing, setRefreshing] = useState(false);

    // 从 CreditContext 获取积分（全局状态，确保购买后自动更新）
    const { credits, creditsLoading, refreshCredits, showCreditModal } = useCredit();

    // 使用全局 Toast
    const { showToast } = useGlobalToast();

    // 使用 Zustand store 管理每个 template 的生成状态
    const { setGenerating, isGenerating: isTemplateGenerating, clearAll } = useTemplateGenerationStore();

    // 解析传递过来的图片数据
    const imageData = params.image ? JSON.parse(params.image as string) : null;

    const [foryou, setForyou] = useState<StyleTemplate[]>([]);
    const [shoplooksMap, setShoplooksMap] = useState<Map<string, ShopLook[]>>(new Map());

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

    // 获取单个模板的 ShopLook
    const getShoplook = async (lookId: string) => {
        const shoplooks = await ShopLookService.getShopLookByLookid(lookId);
        return shoplooks;
    };

    // 批量加载所有模板的 ShopLook
    const loadShoplooks = async (templates: StyleTemplate[]) => {
        if (templates.length === 0) return;

        const lookIds = templates.map(t => t.id);
        const shoplooksData = await ShopLookService.getShopLooksByLookIds(lookIds);
        console.log(`✅ [ForYou] shoplooksData size: ${shoplooksData.size}, keys: ${[...shoplooksData.keys()].join(',')}`);
        setShoplooksMap(shoplooksData);
        console.log(`✅ [ForYou] 加载 ShopLook 完成，共 ${shoplooksData.size} 个模板有关联资源`);
    };
    // 加载模板数据的函数
    const loadTemplates = async () => {
        if (imageData?.name) {
            try {
                const templates = await StyleTemplateService.getTemplateByName(imageData.name);
                console.log(`✅ [ForYou] 获取到 ${templates?.length || 0} 个 ${imageData.name} 模板`);

                if (templates && templates.length > 0) {
                    setForyou(templates);
                    setCurrentIndex(0);

                    // 加载关联的 ShopLook 资源
                    await loadShoplooks(templates);

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
    // 页面浏览追踪
    useFocusEffect(
        useCallback(() => {
            analytics.page('foryou', {
                category: 'features',
                style: imageData?.name || 'unknown',
            });

            // 页面获得焦点时刷新积分，确保积分是最新的（特别是购买后）
            refreshCredits();
        }, [imageData?.name, refreshCredits])
    );

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

    // 使用积分
    const useCredits = async (currentTemplateId: string, currentTemplateName: string, selectedStyles: string) => {
        const requiredCredits = 10;
        const availableCredits = credits?.available_credits || 0;
        let creditsAfter = availableCredits;
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
                await analytics.credits('used', {
                    template_id: currentTemplateId,
                    template_name: currentTemplateName,
                    style: selectedStyles,
                    required_credits: requiredCredits,
                    available_credits: availableCredits,
                    source: 'foryou_page',
                });
                // 刷新积分信息
                await refreshCredits();
                creditsAfter = (credits?.available_credits || availableCredits) - requiredCredits;


                await analytics.trackCreditUsage(
                    'image_generation_foryou',
                    requiredCredits,
                    creditsAfter,
                    {
                        template_id: currentTemplateId,
                        template_name: currentTemplateName,
                        style: selectedStyles,
                    }
                );

                return true;
            } else {
                console.warn('⚠️ [ForYou] 积分扣除失败，但图片已生成');
            }
        } catch (creditError) {
            console.error('❌ [ForYou] 积分扣除异常:', creditError);
        }
        return false;
    }

    const handleNext = async () => {
        // 防抖：立即检查并设置生成状态，防止快速重复点击
        if (!foryou || foryou.length === 0 || currentIndex >= foryou.length) {
            return;
        }

        const currentTemplate = foryou[currentIndex];
        const currentTemplateId = currentTemplate.id;
        const currentImageUrl = currentTemplate.urls;  // 使用 urls 作为参考图
        const prompt = currentTemplate.prompt;

        // 立即检查并设置生成状态，防止重复点击
        if (isTemplateGenerating(currentTemplateId)) {
            showToast({ message: "This look is already being generated...", type: "info" });
            return;
        }

        // 立即设置生成状态，防止在异步操作开始前的重复点击
        setGenerating(currentTemplateId, true);

        try {
            // 安全检查：确保数据已加载

            // 检查用户积分
            const requiredCredits = 10;
            const availableCredits = credits?.available_credits || 0;

            if (availableCredits < requiredCredits) {
                // 追踪积分不足
                await analytics.credits('insufficient', {
                    template_id: currentTemplateId,
                    template_name: currentTemplate.name,
                    style: imageData.name,
                    required_credits: requiredCredits,
                    available_credits: availableCredits,
                    source: 'foryou_page',
                });

                showToast({
                    message: `Need ${requiredCredits} credits to generate image, insufficient credits available`,
                    type: "warning",
                    duration: 3000
                });

                // 延迟显示积分购买弹窗，让用户看到提示信息
                // 注意：购买完成后，CreditContext 会自动刷新积分
                setTimeout(() => {
                    showCreditModal(user?.id || '', "foryou_credit_insufficient");
                }, 1500);
                // 清除生成状态，因为提前返回了
                setGenerating(currentTemplateId, false);
                return;
            }


            const onboardingData = await AsyncStorage.getItem("onboardingData") || "{}";
            const onboardingDataObj = JSON.parse(onboardingData) as OnboardingData;
            const imageUrl = onboardingDataObj.fullBodyPhoto;

            if (!imageUrl) {
                showToast({ message: "Please complete onboarding first", type: "error" });
                // 清除生成状态，因为提前返回了
                setGenerating(currentTemplateId, false);
                return;
            }
            const selectedStyles = imageData.name;

            // 追踪图像生成开始
            await analytics.image('generation_started', {
                template_id: currentTemplateId,
                template_name: currentTemplate.name,
                style: selectedStyles,
                required_credits: requiredCredits,
                available_credits: availableCredits,
                source: 'foryou_page',
            });

            // 扣除积分
            const deductSuccess = await useCredits(currentTemplateId, currentTemplate.name, selectedStyles);
            if (!deductSuccess) {
                Alert.alert('Insufficient credits', 'You need more credits to generate this lookbook');
                setGenerating(currentTemplateId, false);
                return;
            }

            const requestId = generateRequestId('foryou', user?.id || '');
            addImageLook(user?.id || '', requestId, 'foryou', [currentTemplate.post], {
                foryou_id: currentIndex,
                template_id: currentTemplateId,
            });
            // 注意：生成状态已在函数开始时设置，用于防抖
            showToast({
                message: "Generating Try-on", type: "info", action: {
                    label: "Check the Progress in My Looks",
                    onPress: () => {
                        router.replace("/tabs/lookbook");
                    }
                }
            });

            // 使用持久化 AI 服务发起请求，支持中断恢复
            const startTime = Date.now();
            const resultLookbook = await persistentAIService.requestForYou(
                user?.id || '',
                requestId,
                [imageUrl, currentImageUrl],
                prompt,
                {
                    onProgress: (progress) => {
                        console.log(`📊 生成进度: ${progress}%`);
                    }
                }
            );

            const generationTime = Date.now() - startTime;

            if (resultLookbook && resultLookbook.length > 0) {
                // 显示成功消息
                showToast({
                    message: `Your look is ready`,
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

                // 追踪图像生成失败
                await analytics.trackImageGeneration(
                    selectedStyles,
                    requiredCredits,
                    false, // failed
                    {
                        template_id: currentTemplateId,
                        template_name: currentTemplate.name,
                        generation_time_ms: generationTime,
                        error: 'No images generated',
                        source: 'foryou_page',
                    }
                );

                showToast({ message: "Failed to generate lookbook images", type: "error" });
            }
        } catch (error) {
            // 追踪图像生成异常
            // 注意：在 catch 块中，变量可能不在作用域内，使用安全默认值
            const errorStyle = imageData?.name || 'unknown';
            const errorRequiredCredits = 10; // 默认值
            const errorTemplateId = currentIndex < foryou.length ? foryou[currentIndex]?.id : 'unknown';
            const errorTemplateName = currentIndex < foryou.length ? foryou[currentIndex]?.name : 'unknown';

            await analytics.trackImageGeneration(
                errorStyle,
                errorRequiredCredits,
                false, // failed
                {
                    template_id: errorTemplateId,
                    template_name: errorTemplateName,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    source: 'foryou_page',
                }
            );
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
                    className="absolute p-2 m-3"
                    activeOpacity={0.7}
                >
                    <MaterialCommunityIcons name="arrow-left" size={32} color="#000" />
                </TouchableOpacity>
                <View className="flex-1 items-center">
                    <Text className="text-gray-800 text-lg font-semibold">
                        {imageData.name}
                    </Text>
                    <Text className="text-gray-500 text-xs mt-1">
                        {currentIndex + 1} / {foryou.length}
                    </Text>
                </View>
                {/* <TouchableOpacity
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
                </TouchableOpacity> */}
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
                                <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 200 }}>
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
                                        {/* 中间：页面指示器（圆点） */}
                                        <View className="absolute bottom-12 left-0 right-0 flex-row items-center justify-center">
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
                                    </View>

                                    {/* 操作按钮区域 */}
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: 16, marginTop: 16 }}>
                                        {/* 分享按钮 */}
                                        {/* <TouchableOpacity
                                            style={{ width: 48, height: 48, borderRadius: 8, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', ...shadowStyles.small }}
                                            activeOpacity={0.8}
                                            onPress={async () => {
                                                try {
                                                    const currentTemplate = foryou[currentIndex];
                                                    if (!currentTemplate) return;
                                                    await Share.share({
                                                        message: 'Check out this amazing look!',
                                                        url: currentTemplate.post,
                                                        title: 'My Style Look',
                                                    });
                                                } catch (error) {
                                                    console.error('分享失败:', error);
                                                }
                                            }}
                                        >
                                            <MaterialCommunityIcons name="export-variant" size={24} color="#000" />
                                        </TouchableOpacity> */}

                                        {/* Try On 按钮 */}
                                        {!(foryou[currentIndex] && isTemplateGenerating(foryou[currentIndex].id)) ? (
                                            <TouchableOpacity
                                                style={{
                                                    paddingHorizontal: 36,
                                                    paddingVertical: 10,
                                                    borderRadius: 999,
                                                    backgroundColor: '#FF7F50',
                                                    opacity: (foryou.length === 0 || (foryou[currentIndex] && isTemplateGenerating(foryou[currentIndex].id))) ? 0.5 : 1,
                                                }}
                                                activeOpacity={0.8}
                                                onPress={handleNext}
                                                disabled={
                                                    foryou.length === 0 ||
                                                    (foryou[currentIndex] && isTemplateGenerating(foryou[currentIndex].id))
                                                }
                                            >
                                                <Text className="text-white text-lg font-semibold">
                                                    Try On
                                                </Text>
                                            </TouchableOpacity>
                                        ) : (
                                            <TouchableOpacity
                                                style={{
                                                    paddingHorizontal: 48,
                                                    paddingVertical: 14,
                                                    borderRadius: 999,
                                                    backgroundColor: '#FFE5D9',
                                                }}
                                                activeOpacity={1}
                                                disabled={true}
                                            >
                                                <Text className="text-white text-base font-semibold">
                                                    Generating
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>

                                    {/* Shop this look 区块 */}
                                    {foryou[currentIndex] && (shoplooksMap.get(foryou[currentIndex].id)?.length ?? 0) > 0 && (
                                        <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
                                            <Text className="text-xl font-semibold text-gray-900 mb-4">Shop this look</Text>
                                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                                                {(shoplooksMap.get(foryou[currentIndex].id) || []).map((shoplook, idx) => (
                                                    <TouchableOpacity
                                                        key={shoplook.id}
                                                        style={[styles.shopCard, { marginRight: idx % 2 === 0 ? 12 : 0 }]}
                                                        activeOpacity={0.8}
                                                        onPress={() => {
                                                            if (shoplook.resource?.shopurl) {
                                                                // 使用外部浏览器打开
                                                                Linking.openURL(shoplook.resource.shopurl);
                                                            }
                                                        }}
                                                    >
                                                        {shoplook.resource?.url && (
                                                            <Image
                                                                source={{ uri: shoplook.resource.url }}
                                                                style={styles.shopImage}
                                                                contentFit="contain"
                                                            />
                                                        )}
                                                        {/* 商品信息 */}
                                                        <View style={{ paddingVertical: 8 }}>
                                                            {shoplook.resource?.name && (
                                                                <Text
                                                                    className="text-sm text-gray-900 font-medium"
                                                                    numberOfLines={1}
                                                                >
                                                                    {shoplook.resource.name}
                                                                </Text>
                                                            )}
                                                            {/* 价格信息 - 如果有的话
                                                            {shoplook.resource?.type && (
                                                                <Text className="text-xs text-gray-500 mt-1">
                                                                    {shoplook.resource.type}
                                                                </Text>
                                                            )} */}
                                                        </View>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </View>
                                    )}
                                </ScrollView>
                            )}
                            extraData={reloadKey}
                        />
                    </>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    imageContainer: {
        width: SCREEN_WIDTH,
        paddingHorizontal: 16, // 左右边距 16pt
        paddingTop: 16, // 内容之间的行间距 16pt
    },
    mainImage: {
        width: SCREEN_WIDTH - 32, // 减去左右边距
        aspectRatio: 2 / 3, // look详情图比例 2:3
        borderRadius: 10, // 圆角 10
        overflow: 'hidden',
    },
    indicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    indicatorActive: {
        backgroundColor: '#FF7F50', // 珊瑚橙色，匹配 Try On 按钮
    },
    indicatorInactive: {
        backgroundColor: '#FFFFFF', // 白色圆点
    },
    // 商品卡片样式
    shopCard: {
        width: (SCREEN_WIDTH - 32 - 12) / 2, // 两列，减去边距和间距
        borderRadius: 10, // 圆角 10
        backgroundColor: '#fff',
        marginBottom: 16, // 内容之间的行间距 16pt
    },
    shopImage: {
        width: '100%',
        aspectRatio: 1, // 商品缩略图比例 1:1
        borderRadius: 10,
    },
});
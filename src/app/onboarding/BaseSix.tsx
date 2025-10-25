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
import revenueCatService from "@/services/RevenueCatService";
import { useAuth } from "@/contexts/AuthContext";
import { useOfferings, usePurchase, useSubscription } from "@/hooks/useRevenueCat";
import { PurchasesPackage } from "react-native-purchases";
import { supabase } from "@/utils/supabase";
import { useCreatePayment } from "@/hooks/usePayment";
import { validatePurchaseResult, validateDatabaseSync, isUserCancelledError } from "@/utils/purchaseValidation";
import { SafeAreaView } from "react-native-safe-area-context";


// RevenueCat 初始化组件
function RevenueCatInitializer() {
  // const { user } = useAuth();

  useEffect(() => {
    const initRevenueCat = async () => {
      try {
        await revenueCatService.initialize();
      } catch (error: any) {
        // 完全忽略错误 - RevenueCat 服务内部已经处理了
        // 不需要额外的日志，避免重复
      }
    };

    // 使用 Promise.resolve 包裹，确保不会有未捕获的 Promise 错误
    Promise.resolve(initRevenueCat()).catch(() => {
      // 最后一道防线：捕获任何可能的错误
    });
  }, []);

  return null;
}


const imagewidth = Dimensions.get("window").width * 0.4 > 180 ? 180 : Dimensions.get("window").width * 0.4;

export default function BaseSix() {
  const { user } = useAuth();
  const router = useRouter();
  const [name, setName] = useState<string>("");
  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
  const [image, setImage] = useState<string[]>([]);
  const [allSubscriptionPackages, setAllSubscriptionPackages] = useState<PurchasesPackage[]>([]);

  // RevenueCat hooks
  const { currentOffering, loading: offeringsLoading } = useOfferings();
  const { purchase, purchasing } = usePurchase();
  const { refresh: refreshSubscription } = useSubscription();
  const { createPaymentFromRevenueCat } = useCreatePayment();

  useEffect(() => {
    loadImagesUrl();
  }, []);

  // 监听 image 状态变化
  useEffect(() => {
    console.log('🔍Image state changed:', image);
    console.log('🔍Image length:', image.length);
  }, [image]);

  useEffect(() => {
    // 自动选择第一个订阅选项
    if (currentOffering?.availablePackages && currentOffering.availablePackages.length > 0 && !selectedPackage) {
      setSelectedPackage(currentOffering.availablePackages[0]);
    }
  }, [currentOffering]);

  // 加载所有订阅产品
  useEffect(() => {
    const loadAllSubscriptionPackages = async () => {
      try {
        console.log('🔍Loading all subscription packages...');
        const offerings = await revenueCatService.getOfferings();
        console.log('🔍All offerings:', Object.keys(offerings.all));

        const allPackages: PurchasesPackage[] = [];

        // 遍历所有 Offerings 寻找订阅产品
        Object.values(offerings.all).forEach((offering) => {
          console.log(`🔍Checking offering: ${offering.identifier}`);
          offering.availablePackages.forEach((pkg) => {
            if (pkg.product.productType === 'AUTO_RENEWABLE_SUBSCRIPTION' &&
              !pkg.product.identifier.includes('AIPoints')) {
              console.log(`🔍Found subscription: ${pkg.identifier}`);
              allPackages.push(pkg);
            }
          });
        });

        console.log('🔍Total subscription packages found:', allPackages.length);

        // 按价格排序（从低到高）
        const sortedPackages = allPackages.sort((a, b) => {
          const priceA = a.product.price;
          const priceB = b.product.price;
          console.log(`🔍Sorting: ${a.identifier} ($${priceA}) vs ${b.identifier} ($${priceB})`);
          return priceA - priceB;
        });

        console.log('🔍Sorted packages by price:', sortedPackages.map(p => `${p.identifier}: $${p.product.price}`));
        setAllSubscriptionPackages(sortedPackages);

        // 自动选择第一个订阅选项（最便宜的）
        if (sortedPackages.length > 0 && !selectedPackage) {
          setSelectedPackage(sortedPackages[0]);
        }
      } catch (error) {
        console.error('🔍Error loading subscription packages:', error);
      }
    };

    loadAllSubscriptionPackages();
  }, []);

  const loadImagesUrl = async () => {
    console.log('🔍loadImagesUrl');
    try {
      const imagesUrl = await AsyncStorage.getItem("newlook");
      console.log('🔍imagesUrl', imagesUrl);
      if (imagesUrl) {
        const images = imagesUrl.split(',');
        setImage(images);
      } else {
        console.log('🔍No imagesUrl found, trying user profile...');
        // 如果没有本地图片，从用户配置获取
        if (user?.id) {
          try {
            console.log('🔍Fetching user profile for user:', user.id);
            const { data: userProfile, error } = await fetchUserProfileWithRetry(user.id, 3, 8000);
            if (error) {
              console.warn('Failed to fetch user profile:', error);
              setImage([]);
            } else {
              console.log('🔍User profile images:', userProfile?.images);
              const images = userProfile?.images?.split(',') || [];
              setImage(images);
            }
          } catch (error) {
            console.error('Error fetching user profile:', error);
            setImage([]);
          }
        } else {
          console.log('🔍No user ID, setting empty array');
          setImage([]);
        }
      }
    } catch (error) {
      console.error('Error loading images:', error);
      setImage([]);
    }
  }

  const handleNext = async () => {
    // router.dismissAll();
    router.replace({
      pathname: "/tabs/home",
      params: { imagesUrls: JSON.stringify(image) }
    });
  };

  const handlePlanSelect = (pkg: PurchasesPackage) => {
    setSelectedPackage(pkg);
  };

  const handlePurchase = async () => {
    if (!selectedPackage) {
      Alert.alert('提示', '请选择订阅计划');
      return;
    }

    try {
      console.log('🔄 Starting subscription purchase...');

      // 1. 通过 RevenueCat 购买
      const result = await purchase(selectedPackage);

      // 验证购买结果
      const purchaseValidation = validatePurchaseResult(result);
      console.log(purchaseValidation.success ? '✅' : '❌', 'Phase 1:', purchaseValidation.message);

      if (!purchaseValidation.success) {
        throw new Error(purchaseValidation.message);
      }

      // 2. 同步到数据库
      const payment = await createPaymentFromRevenueCat(
        result.customerInfo,
        selectedPackage
      );

      // 验证数据库同步
      const syncValidation = validateDatabaseSync(
        payment,
        selectedPackage.product.identifier
      );
      console.log(syncValidation.success ? '✅' : '⚠️', 'Phase 2:', syncValidation.message);

      if (payment) {
        console.log('✅ Subscription payment saved to database:', payment.id);
      } else {
        console.warn('⚠️ Failed to save subscription payment to database');
      }

      // 3. 刷新订阅状态
      await refreshSubscription();
      console.log('✅ Phase 3: Subscription status refreshed');

      // 4. 成功处理
      if (purchaseValidation.success) {
        console.log('🎉 Subscription purchase completed successfully!');

        Alert.alert(
          '订阅成功！',
          `您的订阅已激活，现在可以使用所有高级功能了！\n\n${syncValidation.success ? '所有数据已同步完成' : '数据正在后台同步'}`,
          [
            {
              text: 'OK',
              onPress: handleNext,
            },
          ]
        );
      }

    } catch (error: any) {
      if (isUserCancelledError(error)) {
        console.log('ℹ️ User cancelled subscription purchase');
        return;
      }

      console.error('❌ Subscription error:', error);
      Alert.alert(
        '订阅失败',
        '无法完成订阅，请稍后重试',
        [{ text: 'OK' }]
      );
    }
  };

  // 获取套餐标题
  const getPackageTitle = (pkg: PurchasesPackage): string => {
    const identifier = pkg.identifier.toLowerCase();
    if (identifier.includes('annual') || identifier.includes('yearly')) {
      return 'Yearly';
    } else if (identifier.includes('monthly')) {
      return 'Monthly';
    } else if (identifier.includes('three_month')) {
      return 'Quarterly';
    }
    return pkg.product.title;
  };

  // 计算每日价格
  const getDailyPrice = (pkg: PurchasesPackage): string => {
    const price = pkg.product.price;
    const identifier = pkg.identifier.toLowerCase();

    if (identifier.includes('annual') || identifier.includes('yearly')) {
      return `$${(price / 365).toFixed(2)} per day`;
    } else if (identifier.includes('quarter')) {
      return `$${(price / 90).toFixed(2)} per day`;
    } else if (identifier.includes('monthly')) {
      return `$${(price / 30).toFixed(2)} per day`;
    }
    return pkg.product.priceString;
  };

  // 获取折扣标签
  const getDiscountLabel = (pkg: PurchasesPackage, packages: PurchasesPackage[]): string | null => {
    const identifier = pkg.identifier.toLowerCase();
    console.log('🖼️ identifier', identifier, packages);
    if (identifier.includes('annual') || identifier.includes('yearly')) {
      return `25% OFF`;
    } else if (identifier.includes('three_month')) {
      return `10% OFF`;
    }

    return null;
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1">
      <RevenueCatInitializer />
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
          <DotsContainer activeIndex={5} indexNumber={6} />
        </View>

        <View className="flex-1 mb-2">
          <View
            className="flex-row justify-center px-2 gap-6 "
            style={{ height: 220 }}
          >
            {(image && image.length > 0) && image.map((item, index) => {

              return (
                <View key={index} style={{ width: imagewidth }}
                  className="overflow-hidden rounded-2xl"
                >
                  <Image
                    source={{ uri: item }}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    onLoadStart={() => {
                      // console.log(`🖼️ Image ${index} loading started`);
                    }}
                    onLoad={() => {
                      // console.log(`🖼️ Image ${index} loaded successfully`);

                    }}
                    onError={(error) => {
                      console.error(`🖼️ Image ${index} failed to load:`, error);
                    }}
                    style={{
                      width: imagewidth,
                      height: '120%',
                      backgroundColor: "#f0f0f0", // 添加背景色以便调试
                    }}
                  />
                </View>
              );
            })}

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


          <View className="flex-row justify-between h-40 px-5">
            {offeringsLoading ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color="#f97316" />
                <Text className="text-gray-600 mt-2">Loading plans...</Text>
              </View>
            ) : allSubscriptionPackages.length === 0 ? (
              <View className="flex-1 items-center justify-center">
                <Text className="text-gray-600 text-center">
                  No subscription plans available at the moment
                </Text>
              </View>
            ) : (
              allSubscriptionPackages.slice(0, 3).map((pkg, index) => {
                console.log(`🔍Rendering subscription ${index}: ${pkg.identifier}`);
                const isSelected = selectedPackage?.identifier === pkg.identifier;
                const discountLabel = getDiscountLabel(pkg, currentOffering?.availablePackages || []);

                return (
                  <Pressable
                    key={pkg.identifier}
                    onPress={() => handlePlanSelect(pkg)}
                    className={`flex-1 rounded-3xl border-2 mx-2 relative overflow-visible ${isSelected
                      ? "border-orange-500 bg-orange-50"
                      : "border-gray-300 bg-gray-300"
                      }`}
                    disabled={purchasing}
                  >
                    {discountLabel && (
                      <View className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 z-10">
                        <View className="bg-orange-500 rounded-2xl px-3 py-1">
                          <Text className="text-white text-xs font-bold">{discountLabel}</Text>
                        </View>
                      </View>
                    )}

                    <View className="flex-1 overflow-hidden bg-gray-300 rounded-3xl">
                      <View className="flex-1 bg-white rounded-t-3xl rounded-3xl">
                        <Text className="text-center py-5 font-medium text-black">
                          {getPackageTitle(pkg)}
                        </Text>
                        <Text className="text-sm py-2 text-center font-medium text-gray-500">
                          {getDailyPrice(pkg)}
                        </Text>
                      </View>
                      <Text className="text-center py-2 font-medium text-orange-500 h-10">
                        {pkg.product.priceString}
                      </Text>
                    </View>
                  </Pressable>
                );
              })
            )}
          </View>

          <View className="p-5 mb-6 flex-col justify-between">
            {/* 订阅按钮 */}
            {currentOffering && currentOffering.availablePackages.length > 0 && (
              <Pressable
                onPress={handlePurchase}
                className="py-2 px-6 rounded-full bg-orange-500 mb-3"
                disabled={purchasing || !selectedPackage}
              >
                {purchasing ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-center font-bold text-white text-lg">
                    {selectedPackage
                      ? `Subscribe ${selectedPackage.product.priceString}`
                      : 'Subscribe Now'}
                  </Text>
                )}
              </Pressable>
            )}

            {/* 跳过按钮 */}
            <Pressable
              onPress={handleNext}
              className="py-4 px-6 bg-black rounded-full"
              disabled={purchasing}
            >
              <Text className="text-center font-semibold text-white">
                Start 3-days Free Trial
              </Text>
            </Pressable>

            {/* 法律说明 */}
            {currentOffering && currentOffering.availablePackages.length > 0 && (
              <Text className="text-xs text-gray-500 text-center mt-4 px-4 leading-5">
                Subscriptions automatically renew unless cancelled at least 24 hours before the end of the current period.
              </Text>
            )}
          </View>

        </View>
      </View>
    </SafeAreaView>
  );
}
// 从 Auth.native.tsx 复制的 fetchUserProfileWithRetry 函数
async function fetchUserProfileWithRetry(
  userId: string,
  maxRetries: number = 3,
  timeout: number = 8000
): Promise<{ data: any; error: any }> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📡 尝试获取用户配置 (${attempt}/${maxRetries})...`);

      const profilePromise = supabase
        .from('profiles')
        .select('name, fullbodyphoto, images')
        .eq('id', userId)
        .single();

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), timeout)
      );

      const result = await Promise.race([profilePromise, timeoutPromise]) as any;

      if (result.error) {
        console.warn(`⚠️ 第 ${attempt} 次查询返回错误:`, result.error);
        if (attempt < maxRetries) {
          // 等待后重试（递增延迟）
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          continue;
        }
        return result;
      }

      console.log(`✅ 成功获取用户配置 (尝试 ${attempt} 次)`);
      return result;
    } catch (error) {
      console.warn(`⚠️ 第 ${attempt} 次查询失败:`, error);
      if (attempt < maxRetries) {
        const delay = 1000 * attempt;
        console.log(`⏳ 等待 ${delay}ms 后重试...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error(`❌ 查询失败，已重试 ${maxRetries} 次`);
        return { data: null, error };
      }
    }
  }
  return { data: null, error: new Error('Max retries exceeded') };
}


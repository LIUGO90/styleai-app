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
  const router = useRouter();
  const [name, setName] = useState<string>("");
  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
  const [image, setImage] = useState<string[]>([]);
  const [loadingImage1, setLoadingImage1] = useState(true);
  const [loadingImage2, setLoadingImage2] = useState(true);

  // RevenueCat hooks
  const { currentOffering, loading: offeringsLoading } = useOfferings();
  const { purchase, purchasing } = usePurchase();
  const { refresh: refreshSubscription } = useSubscription();
  const { createPaymentFromRevenueCat } = useCreatePayment();

  useEffect(() => {
    loadImagesUrl();
  }, []);

  useEffect(() => {
    // 自动选择第一个订阅选项
    if (currentOffering?.availablePackages && currentOffering.availablePackages.length > 0 && !selectedPackage) {
      setSelectedPackage(currentOffering.availablePackages[0]);
    }
  }, [currentOffering]);

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
    } else if (identifier.includes('quarter')) {
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

    if (identifier.includes('annual') || identifier.includes('yearly')) {
      return `25% OFF`;
    } else if (identifier.includes('quarter')) {
      return `10% OFF`;
    }

    return null;
  };

  return (
    <View className="flex-1">
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

        <View className="flex-row justify-between h-40 px-5">
          {offeringsLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#f97316" />
              <Text className="text-gray-600 mt-2">Loading plans...</Text>
            </View>
          ) : !currentOffering || currentOffering.availablePackages.length === 0 ? (
            <View className="flex-1 items-center justify-center">
              <Text className="text-gray-600 text-center">
                No subscription plans available at the moment
              </Text>
            </View>
          ) : (
            currentOffering.availablePackages.slice(0, 3).map((pkg, index) => {
              const isSelected = selectedPackage?.identifier === pkg.identifier;
              const discountLabel = getDiscountLabel(pkg, currentOffering.availablePackages);

              return (
                <Pressable
                  key={pkg.identifier}
                  onPress={() => handlePlanSelect(pkg)}
                  className={`flex-1 rounded-3xl border-2 h-40 mx-2 relative overflow-hidden ${isSelected
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

        <View className="p-5 mb-10">
          {/* 订阅按钮 */}
          {currentOffering && currentOffering.availablePackages.length > 0 && (
            <Pressable
              onPress={handlePurchase}
              className="py-5 px-6 rounded-full bg-orange-500 mb-3"
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
            className="py-4 px-6"
            disabled={purchasing}
          >
            <Text className="text-center font-semibold text-gray-600">
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
  );
}

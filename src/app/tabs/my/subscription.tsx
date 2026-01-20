import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Linking, Pressable, Modal, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSubscription, usePurchase, useManageSubscription } from '@/hooks/useRevenueCat';
import { useActiveSubscriptions, useCreatePayment, usePayments } from '@/hooks/usePayment';
import { useCreditsStore } from '@/stores/creditsStore';
import { useAuth } from '@/contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import BaseSix from './BaseSix';
import BuyCredit, { CreditPackage } from '@/components/BuyCredit';
import { analytics } from '@/services/AnalyticsService';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';



export default function SubscriptionScreen() {
  const { isActive, expirationDate, loading, customerInfo } = useSubscription();
  const { user } = useAuth();
  const { subscriptions, loading: subscriptionsLoading, refresh: refreshSubscriptions } = useActiveSubscriptions();
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);
  const [productInfo, setProductInfo] = useState<any>(null);
  const [showPaywallModal, setShowPaywallModal] = useState(false);

  // 使用 Zustand store 的积分（全局状态，自动更新）
  const credits = useCreditsStore((state) => state.credits);
  const refreshCreditsStore = useCreditsStore((state) => state.refreshCredits);

  // 页面浏览追踪和刷新积分
  useFocusEffect(
    useCallback(() => {
      analytics.page('subscription_management', {
        category: 'settings',
        section: 'my',
      });

      // 进入页面时刷新积分
      if (user?.id) {
        refreshCreditsStore(user.id).catch(() => {
          // 静默失败
        });
      }
    }, [user?.id, refreshCreditsStore])
  );

  // 检查是否为订阅产品（而非积分包）
  const isSubscriptionProduct = (productId: string): boolean => {
    // 积分包通常包含 AIPoints 关键词
    // 订阅产品通常包含 monthly, yearly, pro, premium 等关键词
    const subscriptionKeywords = ['monthly', 'yearly', 'pro', 'premium', 'subscription'];
    const creditKeywords = ['aipoints', 'credits', 'points'];

    const lowerProductId = productId.toLowerCase();

    // 如果包含积分包关键词，则不是订阅
    if (creditKeywords.some(keyword => lowerProductId.includes(keyword))) {
      return false;
    }

    // 如果包含订阅关键词，则是订阅
    if (subscriptionKeywords.some(keyword => lowerProductId.includes(keyword))) {
      return true;
    }

    // 默认为订阅产品
    return true;
  };

  // 格式化产品名称
  const formatProductName = (productId: string): string => {
    // 移除下划线，首字母大写
    return productId
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // 获取详细的订阅信息（从 Supabase 加载）
  useEffect(() => {
    // 如果 Supabase 没有数据，回退到 RevenueCat
    if (customerInfo) {
      const activeEntitlements = customerInfo.entitlements.active;
      const allEntitlements = customerInfo.entitlements.all;
      const activeSubscriptions = customerInfo.activeSubscriptions;

      // 尝试从所有权益中获取订阅信息（过滤掉积分包）
      const entitlementKeys = Object.keys(activeEntitlements);

      // 过滤出真正的订阅产品
      const subscriptionEntitlements = entitlementKeys.filter(key => {
        const entitlement = activeEntitlements[key];
        return isSubscriptionProduct(entitlement.productIdentifier);
      });

      if (subscriptionEntitlements.length > 0) {
        const activeEntitlement = activeEntitlements[subscriptionEntitlements[0]];

        setSubscriptionDetails({
          productIdentifier: activeEntitlement.productIdentifier,
          expirationDate: activeEntitlement.expirationDate,
          purchaseDate: activeEntitlement.latestPurchaseDate,
          originalPurchaseDate: activeEntitlement.originalPurchaseDate,
          willRenew: activeEntitlement.willRenew,
          periodType: activeEntitlement.periodType,
          isSandbox: activeEntitlement.isSandbox,
          billingIssueDetectedAt: activeEntitlement.billingIssueDetectedAt,
          unsubscribeDetectedAt: activeEntitlement.unsubscribeDetectedAt,
        });

        // 获取产品详细信息
        setProductInfo({
          id: activeEntitlement.productIdentifier,
          name: formatProductName(activeEntitlement.productIdentifier),
          period: activeEntitlement.periodType,
          isSubscription: true,
        });
      } else if (activeSubscriptions.length > 0) {
        // 如果有活跃订阅但没有权益，尝试从所有权益中查找
        const allEntitlementKeys = Object.keys(allEntitlements);

        // 过滤出真正的订阅产品
        const allSubscriptionEntitlements = allEntitlementKeys.filter(key => {
          const entitlement = allEntitlements[key];
          return isSubscriptionProduct(entitlement.productIdentifier);
        });

        if (allSubscriptionEntitlements.length > 0) {
          const latestEntitlement = allEntitlements[allSubscriptionEntitlements[0]];

          setSubscriptionDetails({
            productIdentifier: latestEntitlement.productIdentifier,
            expirationDate: latestEntitlement.expirationDate,
            purchaseDate: latestEntitlement.latestPurchaseDate,
            originalPurchaseDate: latestEntitlement.originalPurchaseDate,
            willRenew: latestEntitlement.willRenew,
            periodType: latestEntitlement.periodType,
            isSandbox: latestEntitlement.isSandbox,
            billingIssueDetectedAt: latestEntitlement.billingIssueDetectedAt,
            unsubscribeDetectedAt: latestEntitlement.unsubscribeDetectedAt,
          });

          setProductInfo({
            id: latestEntitlement.productIdentifier,
            name: formatProductName(latestEntitlement.productIdentifier),
            period: latestEntitlement.periodType,
            isSubscription: true,
          });
        } else {
          // 如果没有订阅产品，过滤 activeSubscriptions 中的订阅产品
          const subscriptionProductIds = activeSubscriptions.filter(id => isSubscriptionProduct(id));

          if (subscriptionProductIds.length > 0) {
            const subscriptionId = subscriptionProductIds[0];
            setSubscriptionDetails(null);
            setProductInfo({
              id: subscriptionId,
              name: formatProductName(subscriptionId),
              period: 'unknown',
              isSubscription: true,
            });
          } else {
            // 没有真正的订阅产品
            setSubscriptionDetails(null);
            setProductInfo(null);
          }
        }
      } else {
        setSubscriptionDetails(null);
        setProductInfo(null);
      }
    } else if (!subscriptionsLoading && subscriptions.length === 0) {
      // 没有订阅数据
      setSubscriptionDetails(null);
      setProductInfo(null);
    }

  }, [subscriptions, subscriptionsLoading, customerInfo, isActive, expirationDate]);

  // 强制刷新订阅数据
  const handleRefresh = async () => {
    try {
      await refreshSubscriptions();
    } catch (error) {
      // 静默失败
    }
  };

  if (loading || subscriptionsLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#000" />
        <Text className="text-gray-600 mt-4">Loading subscription...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-center px-6 py-1">
        <Text className="text-black text-xl font-bold text-center">Credits Store</Text>

          <TouchableOpacity
            onPress={() => router.replace("/tabs/my")}
            className="p-2 absolute left-4"
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="black" />
          </TouchableOpacity>
          <View className="flex-row items-center absolute right-4">
            <TouchableOpacity
              onPress={handleRefresh}
              disabled={subscriptionsLoading}
              className="p-2"
            >
              {subscriptionsLoading ? (
                <ActivityIndicator size="small" color="#3b82f6" />
              ) : (
                <MaterialCommunityIcons name="refresh" size={24} color="#3b82f6" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/tabs/my/manageSub")}
              className="p-2"
            >
              <MaterialCommunityIcons name="information-outline" size={24} color="black" />
            </TouchableOpacity>
          </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Premium Subscription Card */}
        <View className="px-6 mb-6  rounded-2xl">
          <View className="bg-gradient-to-br from-amber-50 bg-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-3xl font-bold text-orange-800 mb-1">
                  {(productInfo && productInfo.isSubscription) ? 'Premium' : 'Try Premium'}
                </Text>

                {productInfo && productInfo.isSubscription
                  ? <><Text className="text-orange-700 text-lg mb-2">
                    1000 Free Credits/Month
                  </Text>
                    <View className="mt-2">
                      <Text className="text-gray-600 text-sm font-semibold">
                        {subscriptionDetails?.expirationDate
                          ? `Renew on ${new Date(subscriptionDetails.expirationDate).toLocaleString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}`
                          : expirationDate && expirationDate !== null
                          ? `Renew on ${new Date(expirationDate).toLocaleString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}`
                          : ''}
                      </Text>
                    </View>
                  </>
                  :
                  <>
                    <Text className="text-orange-700 mb-2">Get 1000 Credits Per Month</Text>
                    <View className='flex-row '>

                      <Pressable
                        onPress={() => setShowPaywallModal(true)}
                        className="bg-orange-200 rounded-full px-6 py-2 my-4 "
                      >
                        <Text className="text-white text-base font-semibold text-center">
                          TRY FOR FREE
                        </Text>
                      </Pressable>
                    </View>
                  </>
                }

              </View>
              <View className="w-16 h-16 bg-orange-200 rounded-full items-center justify-center">
                <MaterialCommunityIcons name="crown" size={32} color="#ea580c" />
              </View>
            </View>
          </View>
        </View>

        {/* Buy Credits Section */}
        <BuyCredit />


      </ScrollView>

      {/* BaseSix Bottom Sheet Modal (65% screen height) */}
      <Modal
        visible={showPaywallModal}
        animationType="slide"
        transparent
        onRequestClose={() => {
          handleRefresh();
          setShowPaywallModal(false)
        }}
      >
        <Pressable
          className="flex-1 justify-end bg-black/40"
          onPress={() => setShowPaywallModal(false)}
        >
          <Pressable
            style={{ height: Dimensions.get('window').height * 0.65 }}
            className="bg-white rounded-t-3xl overflow-hidden"
            onPress={(e) => e.stopPropagation()}
          >
            <BaseSix
              isPaywall={true}
              onClose={() => setShowPaywallModal(false)}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

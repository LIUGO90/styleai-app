import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Linking } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSubscription, usePurchase, useManageSubscription } from '@/hooks/useRevenueCat';
import { useActiveSubscriptions } from '@/hooks/usePayment';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Platform } from 'react-native';

export default function ManageSubScreen() {
  const { isActive, loading, customerInfo } = useSubscription();
  const { restore, restoring } = usePurchase();
  const { showManageSubscriptions } = useManageSubscription();
  const { subscriptions, loading: subscriptionsLoading, refresh: refreshSubscriptions } = useActiveSubscriptions();
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);
  const [productInfo, setProductInfo] = useState<any>(null);

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
  }, [subscriptions, subscriptionsLoading, customerInfo, isActive]);

  const handleRestore = async () => {
    try {
      await restore();
      await refreshSubscriptions(); // 刷新 Supabase 订阅数据
      Alert.alert('Success', 'Purchase restored successfully');
    } catch (error) {
      Alert.alert('Failed', 'Unable to restore purchase, please try again later');
    }
  };

  // 处理取消订阅
  const handleCancelSubscription = () => {
    Alert.alert(
      'Cancel Subscription',
      'You can manage your subscription through the following ways:\n\n• Manage subscription in App Store\n• Manage subscription through device settings\n\nAfter cancellation, you will continue to enjoy the service until the end of your current billing cycle.',
      [
        {
          text: 'Manage in App Store',
          onPress: () => {
            if (customerInfo?.managementURL) {
              Linking.openURL(customerInfo.managementURL);
            } else {
              // 如果没有 managementURL，引导用户到 App Store
              if (Platform.OS === 'ios') {
                Linking.openURL('https://apps.apple.com/account/subscriptions');
              }
            }
          }
        },
        {
          text: 'Device Settings',
          onPress: () => {
            if (Platform.OS === 'ios') {
              Alert.alert(
                'Device Settings',
                'Please follow these steps:\n\n1. Open the "Settings" app\n2. Tap your Apple ID\n3. Select "Subscriptions"\n4. Find and manage your subscription',
                [{ text: 'OK' }]
              );
            }
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
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
      <View className="px-6 pt-4 pb-2">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-2"
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="black" />
          </TouchableOpacity>
          <Text className="flex-1 text-center text-black text-xl font-bold">Subscription</Text>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
   
        {/* Management Options */}
        <View className="px-6 mb-6">
          <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            {(productInfo && productInfo.isSubscription) ? (
              <>
                <TouchableOpacity
                  onPress={async () => {
                    try {
                      await showManageSubscriptions();
                    } catch (error) {
                      Alert.alert('Error', 'Unable to open subscription management. Please manage your subscription through your device settings.');
                    }
                  }}
                  className="flex-row items-center justify-between py-4"
                >
                  <View className="flex-row items-center">
                    <MaterialCommunityIcons name="cog" size={24} color="#3b82f6" />
                    <Text className="text-lg font-semibold text-gray-900 ml-3">Manage Subscription</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={24} color="#9ca3af" />
                </TouchableOpacity>

                <View className="h-px bg-gray-200 my-2" />
              </>
            ) : (<>
              <TouchableOpacity
                onPress={async () => {
                  router.replace("/tabs/my/BaseSix");
                }}
                className="flex-row items-center justify-between py-4"
              >
                <View className="flex-row items-center">
                  <MaterialCommunityIcons name="cog" size={24} color="#3b82f6" />
                  <Text className="text-lg font-semibold text-gray-900 ml-3">Pay Subscription</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color="#9ca3af" />
              </TouchableOpacity>

              <View className="h-px bg-gray-200 my-2" />
            </>
            )}

            <TouchableOpacity
              onPress={handleRestore}
              disabled={restoring}
              className="flex-row items-center justify-between py-4"
            >
              <View className="flex-row items-center">
                <MaterialCommunityIcons name="restore" size={24} color="#3b82f6" />
                <Text className="text-lg font-semibold text-gray-900 ml-3">Restore Purchase</Text>
              </View>
              {restoring ? (
                <ActivityIndicator color="#3b82f6" size="small" />
              ) : (
                <MaterialCommunityIcons name="chevron-right" size={24} color="#9ca3af" />
              )}
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

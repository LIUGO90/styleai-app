import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Linking } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSubscription, usePurchase, useManageSubscription } from '@/hooks/useRevenueCat';
import { useActiveSubscriptions } from '@/hooks/usePayment';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Platform } from 'react-native';

export default function SubscriptionScreen() {
  const { isActive, isPro, isPremium, expirationDate, willRenew, productIdentifier, loading, customerInfo } = useSubscription();
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
    console.log('📊 [Subscription] Supabase subscriptions:', subscriptions);
    console.log('📊 [Subscription] subscriptionsLoading:', subscriptionsLoading);
    console.log('📊 [Subscription] Customer Info:', customerInfo);
    console.log('📊 [Subscription] isActive:', isActive);
    // return;
    // 优先使用 Supabase 数据
    if (!subscriptionsLoading && subscriptions.length > 0) {
      console.log('📊 [Subscription] 使用 Supabase 数据加载订阅信息');

      // 获取第一个活跃订阅（按过期日期排序，最晚的在前）
      const activeSubscription = subscriptions[0];

      console.log('📊 [Subscription] Active Subscription from Supabase:', {
        productId: activeSubscription.product_id,
        productName: activeSubscription.product_name,
        expirationDate: activeSubscription.expiration_date,
        willRenew: activeSubscription.will_renew,
        isActive: activeSubscription.is_active,
        status: activeSubscription.status,
      });

      setSubscriptionDetails({
        productIdentifier: activeSubscription.product_id,
        expirationDate: activeSubscription.expiration_date,
        purchaseDate: activeSubscription.purchase_date,
        originalPurchaseDate: activeSubscription.purchase_date,
        willRenew: activeSubscription.will_renew,
        periodType: activeSubscription.subscription_period || 'monthly',
        isSandbox: false,
        billingIssueDetectedAt: null,
        unsubscribeDetectedAt: null,
      });

      setProductInfo({
        id: activeSubscription.product_id,
        name: activeSubscription.product_name || formatProductName(activeSubscription.product_id),
        period: activeSubscription.subscription_period || 'monthly',
        isSubscription: true,
      });

      return;
    }

    // 如果 Supabase 没有数据，回退到 RevenueCat
    if (customerInfo) {
      console.log('📊 [Subscription] 使用 RevenueCat 数据加载订阅信息');

      const activeEntitlements = customerInfo.entitlements.active;
      const allEntitlements = customerInfo.entitlements.all;
      const activeSubscriptions = customerInfo.activeSubscriptions;

      console.log('📊 [Subscription] Active Entitlements:', Object.keys(activeEntitlements));
      console.log('📊 [Subscription] All Entitlements:', Object.keys(allEntitlements));
      console.log('📊 [Subscription] Active Subscriptions:', activeSubscriptions);

      // 尝试从所有权益中获取订阅信息（过滤掉积分包）
      const entitlementKeys = Object.keys(activeEntitlements);

      // 过滤出真正的订阅产品
      const subscriptionEntitlements = entitlementKeys.filter(key => {
        const entitlement = activeEntitlements[key];
        return isSubscriptionProduct(entitlement.productIdentifier);
      });

      console.log('📊 [Subscription] All Entitlements:', entitlementKeys);
      console.log('📊 [Subscription] Subscription Entitlements (filtered):', subscriptionEntitlements);

      if (subscriptionEntitlements.length > 0) {
        const activeEntitlement = activeEntitlements[subscriptionEntitlements[0]];
        console.log('📊 [Subscription] Active Subscription Entitlement Details:', activeEntitlement);

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
        console.log('📊 [Subscription] No active entitlements, checking all entitlements...');
        const allEntitlementKeys = Object.keys(allEntitlements);

        // 过滤出真正的订阅产品
        const allSubscriptionEntitlements = allEntitlementKeys.filter(key => {
          const entitlement = allEntitlements[key];
          return isSubscriptionProduct(entitlement.productIdentifier);
        });

        console.log('📊 [Subscription] All Subscription Entitlements (filtered):', allSubscriptionEntitlements);

        if (allSubscriptionEntitlements.length > 0) {
          const latestEntitlement = allEntitlements[allSubscriptionEntitlements[0]];
          console.log('📊 [Subscription] Latest Subscription Entitlement Details:', latestEntitlement);

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
      console.log('📊 [Subscription] 没有找到任何订阅');
      setSubscriptionDetails(null);
      setProductInfo(null);
    }
  }, [subscriptions, subscriptionsLoading, customerInfo, isActive]);

  // 强制刷新订阅数据
  const handleRefresh = async () => {
    try {
      console.log('🔄 [Subscription] 强制刷新订阅数据...');
      await refreshSubscriptions(); // 刷新 Supabase 订阅数据
    } catch (error) {
      console.error('❌ [Subscription] 刷新失败:', error);
    }
  };

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

  // 处理继续订阅
  const handleContinueSubscription = () => {
    Alert.alert(
      'Continue Subscription',
      'Your subscription will automatically renew. To modify subscription settings, please use the "Manage Subscription" feature.',
      [
        {
          text: 'Manage Subscription',
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
        { text: 'OK', style: 'default' }
      ]
    );
  };

  // 查看完整订阅信息（开发调试用）
  const handleViewFullDetails = () => {
    const details: any = {
      supabaseSubscriptions: subscriptions.length,
      supabaseData: subscriptions.map(sub => ({
        productId: sub.product_id,
        productName: sub.product_name,
        status: sub.status,
        isActive: sub.is_active,
        expirationDate: sub.expiration_date,
        willRenew: sub.will_renew,
      })),
      subscriptionDetails: subscriptionDetails,
      productInfo: productInfo,
    };

    if (customerInfo) {
      const activeEntitlements = customerInfo.entitlements.active;
      const allEntitlements = customerInfo.entitlements.all;
      const activeSubscriptions = customerInfo.activeSubscriptions;
      const allPurchaseDates = customerInfo.allPurchaseDates;

      details.revenueCat = {
        userId: customerInfo.originalAppUserId,
        activeSubscriptions,
        allPurchaseDates,
        activeEntitlements: Object.keys(activeEntitlements),
        allEntitlements: Object.keys(allEntitlements),
        requestDate: customerInfo.requestDate,
        firstSeen: customerInfo.firstSeen,
        managementURL: customerInfo.managementURL,
      };
    }

    console.log('📊 Complete Subscription Info:', JSON.stringify(details, null, 2));

    Alert.alert(
      'Subscription Information',
      `Data Source: ${subscriptions.length > 0 ? 'Supabase' : 'RevenueCat'}\n\n` +
      `Supabase Subscriptions: ${subscriptions.length}\n` +
      `${subscriptions.length > 0 ? `Product: ${subscriptions[0].product_name}\nStatus: ${subscriptions[0].status}` : ''}\n\n` +
      `${customerInfo ? `RevenueCat User: ${customerInfo.originalAppUserId}\n` : ''}` +
      `Full details logged to console.`,
      [{ text: 'OK' }]
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
            onPress={() => router.replace("/tabs/my")}
            className="p-2"
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="black" />
          </TouchableOpacity>
          <Text className="text-black text-xl font-bold">Subscription</Text>
          <View className="flex-row items-center">
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
            {/* <TouchableOpacity
              onPress={handleViewFullDetails}
              className="p-2"
            >
              <MaterialCommunityIcons name="information-outline" size={24} color="black" />
            </TouchableOpacity> */}
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Premium Subscription Card */}
        <View className="px-6 mb-6  rounded-2xl">
          <View className="bg-gradient-to-br from-amber-50 bg-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-3xl font-bold text-orange-800 mb-1">
                  {(productInfo && productInfo.isSubscription) ? 'Premium' : 'Free'}
                </Text>
                <Text className="text-orange-700 text-lg mb-2">
                  {(productInfo && productInfo.isSubscription)
                    ? '1000 Free Credits/Month'
                    : 'Upgrade to Premium'}
                </Text>
                {/* <Text className="text-gray-500 text-sm">
                  {expirationDate 
                    ? `${willRenew ? 'Renew' : 'Expires'} on ${new Date(expirationDate).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}`
                    : (subscriptionDetails?.expirationDate)
                      ? `${subscriptionDetails.willRenew ? 'Renew' : 'Expires'} on ${new Date(subscriptionDetails.expirationDate).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}`
                      : (customerInfo && customerInfo.activeSubscriptions.length > 0)
                        ? 'Active subscription'
                        : 'No active subscription'
                  }
                </Text> */}
                {productInfo && (
                  <View className="mt-2">
                    <Text className="text-gray-600 text-sm font-semibold">
                      {productInfo.name}
                    </Text>
                    {productInfo.period && productInfo.period !== 'unknown' && (
                      <Text className="text-gray-400 text-xs mt-0.5 capitalize">
                        {productInfo.period} billing
                      </Text>
                    )}
                  </View>
                )}
              </View>
              <View className="w-16 h-16 bg-orange-200 rounded-full items-center justify-center">
                <MaterialCommunityIcons name="crown" size={32} color="#ea580c" />
              </View>
            </View>
          </View>
        </View>


        {/* Subscription Actions */}
        {(productInfo && productInfo.isSubscription) && (
          <View className="px-6 mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-3">Subscription Management</Text>

            {/* Cancel/Continue Subscription Buttons */}
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-4">
              {/* Cancel Subscription Button */}
              <TouchableOpacity
                onPress={handleCancelSubscription}
                className="flex-row items-center justify-center py-4 px-6 bg-red-50 rounded-lg border border-red-200 mb-3"
              >
                <MaterialCommunityIcons name="cancel" size={20} color="#dc2626" />
                <Text className="text-red-700 font-semibold text-base ml-2">Cancel Subscription</Text>
              </TouchableOpacity>

              {/* Continue Subscription Button */}
              <TouchableOpacity
                onPress={handleContinueSubscription}
                className="flex-row items-center justify-center py-4 px-6 bg-green-50 rounded-lg border border-green-200"
              >
                <MaterialCommunityIcons name="check-circle" size={20} color="#16a34a" />
                <Text className="text-green-700 font-semibold text-base ml-2">Continue Subscription</Text>
              </TouchableOpacity>
            </View>

            {/* Important Notice */}
            <View className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <View className="flex-row items-start">
                <MaterialCommunityIcons name="information" size={20} color="#2563eb" />
                <View className="flex-1 ml-2">
                  <Text className="text-blue-900 font-semibold text-sm mb-1">Important Notice</Text>
                  <Text className="text-blue-700 text-xs leading-relaxed">
                    • Cancellation takes effect at the end of your current billing period{'\n'}
                    • You'll continue to have access until then{'\n'}
                    • No refunds for unused time{'\n'}
                    • You can resubscribe anytime
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

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

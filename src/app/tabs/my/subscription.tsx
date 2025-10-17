import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSubscription, usePurchase, useManageSubscription } from '@/hooks/useRevenueCat';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SubscriptionScreen() {
  const { isActive, isPro, isPremium, expirationDate, willRenew, productIdentifier, loading, customerInfo } = useSubscription();
  const { restore, restoring } = usePurchase();
  const { showManageSubscriptions } = useManageSubscription();
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);

  // 获取详细的订阅信息
  useEffect(() => {
    if (customerInfo && isActive) {
      const activeEntitlements = customerInfo.entitlements.active;
      const entitlementKeys = Object.keys(activeEntitlements);
      
      if (entitlementKeys.length > 0) {
        const activeEntitlement = activeEntitlements[entitlementKeys[0]];
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
      }
    } else {
      setSubscriptionDetails(null);
    }
  }, [customerInfo, isActive]);

  const handleRestore = async () => {
    try {
      await restore();
      Alert.alert('成功', '已恢复购买');
    } catch (error) {
      Alert.alert('失败', '无法恢复购买，请稍后重试');
    }
  };

  // 查看完整订阅信息（开发调试用）
  const handleViewFullDetails = () => {
    if (customerInfo) {
      const activeEntitlements = customerInfo.entitlements.active;
      const allEntitlements = customerInfo.entitlements.all;
      const activeSubscriptions = customerInfo.activeSubscriptions;
      const allPurchaseDates = customerInfo.allPurchaseDates;
      
      const details = {
        userId: customerInfo.originalAppUserId,
        activeSubscriptions,
        allPurchaseDates,
        activeEntitlements: Object.keys(activeEntitlements),
        allEntitlements: Object.keys(allEntitlements),
        requestDate: customerInfo.requestDate,
        firstSeen: customerInfo.firstSeen,
        managementURL: customerInfo.managementURL,
        subscriptionDetails: subscriptionDetails,
      };
      
      console.log('📊 Complete Subscription Info:', JSON.stringify(details, null, 2));
      
      Alert.alert(
        'Subscription Information',
        `User ID: ${customerInfo.originalAppUserId}\n\n` +
        `Active Subscriptions: ${activeSubscriptions.length}\n` +
        `${activeSubscriptions.join(', ')}\n\n` +
        `Active Entitlements: ${Object.keys(activeEntitlements).join(', ') || 'None'}\n\n` +
        `Full details logged to console.`,
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert('No Subscription Data', 'No subscription information available');
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#000" />
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
          <TouchableOpacity
            onPress={handleViewFullDetails}
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
                  {isActive ? 'Premium' : 'Free'}
                </Text>
                <Text className="text-orange-700 text-lg mb-2">
                  {isActive ? '1000 Free Credits/Month' : 'Upgrade to Premium'}
                </Text>
                <Text className="text-gray-500 text-sm">
                  {isActive && expirationDate 
                    ? `${willRenew ? 'Renew' : 'Expires'} on ${new Date(expirationDate).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}`
                    : isActive 
                      ? 'Active subscription'
                      : 'No active subscription'
                  }
                </Text>
                {productIdentifier && (
                  <Text className="text-gray-400 text-xs mt-1">
                    Plan: {productIdentifier}
                  </Text>
                )}
              </View>
              <View className="w-16 h-16 bg-orange-200 rounded-full items-center justify-center">
                <MaterialCommunityIcons name="crown" size={32} color="#ea580c" />
              </View>
            </View>
          </View>
        </View>

        {/* Subscription Details - 当前订阅详情 */}
        {isActive && subscriptionDetails && (
          <View className="px-6 mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-3">Current Subscription Details</Text>
            <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              {/* Subscription Status */}
              <View className="mb-3">
                <Text className="text-xs text-gray-500 mb-1">Status</Text>
                <View className="flex-row items-center">
                  <MaterialCommunityIcons 
                    name={willRenew ? "check-circle" : "alert-circle"} 
                    size={16} 
                    color={willRenew ? "#22c55e" : "#f59e0b"} 
                  />
                  <Text className="text-sm font-semibold text-gray-900 ml-2">
                    {willRenew ? 'Active - Will Renew' : subscriptionDetails.unsubscribeDetectedAt ? 'Canceled' : 'Active'}
                  </Text>
                </View>
              </View>

              {/* Purchase Date */}
              {subscriptionDetails.purchaseDate && (
                <View className="mb-3">
                  <Text className="text-xs text-gray-500 mb-1">Purchase Date</Text>
                  <Text className="text-sm text-gray-900">
                    {new Date(subscriptionDetails.purchaseDate).toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </View>
              )}

              {/* Next Billing Date - 下一次续订日期 */}
              {subscriptionDetails.expirationDate && willRenew && (
                <View className="mb-3 bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <Text className="text-xs text-blue-600 mb-1 font-semibold">Next Billing Date</Text>
                  <Text className="text-sm font-bold text-blue-900">
                    {new Date(subscriptionDetails.expirationDate).toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </Text>
                  <Text className="text-xs text-blue-700 mt-1">
                    Your subscription will automatically renew on this date
                  </Text>
                </View>
              )}

              {/* Expiration Date (if not renewing) */}
              {subscriptionDetails.expirationDate && !willRenew && (
                <View className="mb-3 bg-amber-50 p-3 rounded-lg border border-amber-200">
                  <Text className="text-xs text-amber-600 mb-1 font-semibold">Expires On</Text>
                  <Text className="text-sm font-bold text-amber-900">
                    {new Date(subscriptionDetails.expirationDate).toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </Text>
                  <Text className="text-xs text-amber-700 mt-1">
                    Your subscription will not renew. Reactivate before expiration to continue.
                  </Text>
                </View>
              )}

              {/* Period Type */}
              {subscriptionDetails.periodType && (
                <View className="mb-3">
                  <Text className="text-xs text-gray-500 mb-1">Billing Period</Text>
                  <Text className="text-sm text-gray-900 capitalize">
                    {subscriptionDetails.periodType}
                  </Text>
                </View>
              )}

              {/* Billing Issues */}
              {subscriptionDetails.billingIssueDetectedAt && (
                <View className="mb-3 bg-red-50 p-3 rounded-lg border border-red-200">
                  <View className="flex-row items-center mb-1">
                    <MaterialCommunityIcons name="alert" size={16} color="#ef4444" />
                    <Text className="text-xs text-red-600 ml-1 font-semibold">Billing Issue Detected</Text>
                  </View>
                  <Text className="text-xs text-red-700">
                    Please update your payment method to avoid service interruption
                  </Text>
                </View>
              )}

              {/* Sandbox Mode */}
              {subscriptionDetails.isSandbox && (
                <View className="mt-2 bg-yellow-50 p-2 rounded border border-yellow-300">
                  <Text className="text-xs text-yellow-700 text-center">
                    🧪 Test Mode - This is a sandbox subscription
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Management Options */}
        <View className="px-6 mb-6">
          <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            {isActive && (
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

        {/* Navigate to Credits */}
        <View className="px-6 mb-6">
          <TouchableOpacity
            onPress={() => router.push('/tabs/my/credit')}
            className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border border-orange-200"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <View className="flex-row items-center mb-2">
                  <MaterialCommunityIcons name="star" size={24} color="#f59e0b" />
                  <Text className="text-xl font-bold text-orange-900 ml-2">Buy Credits</Text>
                </View>
                <Text className="text-orange-700 text-sm">
                  Get more AI credits to generate outfits
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#f59e0b" />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

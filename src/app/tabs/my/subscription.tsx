import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Linking, Pressable, Modal, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSubscription, usePurchase, useManageSubscription } from '@/hooks/useRevenueCat';
import { useActiveSubscriptions, useCreatePayment, useCredits, usePayments } from '@/hooks/usePayment';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import BaseSix from './BaseSix';
import { PurchasesPackage } from 'react-native-purchases';
import { isUserCancelledError, validateDatabaseSync, validatePurchaseResult } from '@/utils/purchaseValidation';
import revenueCatService from '@/services/RevenueCatService';


interface CreditPackage {
  package: PurchasesPackage;
  credits: number;
  discount: string | null;
}

export default function SubscriptionScreen() {
  const { isActive, isPro, isPremium, expirationDate, willRenew, productIdentifier, loading, customerInfo } = useSubscription();
  const { restore, restoring, purchase, purchasing } = usePurchase();
  const { showManageSubscriptions } = useManageSubscription();
  const { subscriptions, loading: subscriptionsLoading, refresh: refreshSubscriptions } = useActiveSubscriptions();
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);
  const [productInfo, setProductInfo] = useState<any>(null);
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  const [creditPackages, setCreditPackages] = useState<CreditPackage[]>([]);
  const { credits, refresh: refreshCredits } = useCredits();
  const { createPaymentFromRevenueCat } = useCreatePayment();
  const { payments, loading: paymentsLoading, refresh: refreshPayments } = usePayments(); // 从 Supabase 加载
  const { refresh } = useSubscription();

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

  const loadCreditPackages = async () => {
    console.log('📦 [Credit Page] Loading credit packages from ALL offerings...');

    try {
      // 获取所有 Offerings，而不是只从 Current Offering
      const allOfferings = await revenueCatService.getOfferings();
      console.log('📦 [Credit Page] All Offerings:', Object.keys(allOfferings.all));
      console.log('📦 [Credit Page] Total Offerings count:', Object.keys(allOfferings.all).length);

      // 检查是否包含 AIPoints_100 Offering
      const aiPointsOfferings = Object.keys(allOfferings.all).filter(key => key.includes('AIPoints'));
      console.log('📦 [Credit Page] AIPoints Offerings:', aiPointsOfferings);

      const packages: CreditPackage[] = [];

      // 遍历所有 Offerings 寻找积分产品
      Object.values(allOfferings.all).forEach((offering, offeringIndex) => {
        console.log(`📦 [Credit Page] Checking Offering ${offeringIndex + 1}: ${offering.identifier}`);
        console.log(`📦 [Credit Page] Packages in ${offering.identifier}:`, offering.availablePackages.length);

        offering.availablePackages.forEach((pkg, index) => {
          const productId = pkg.product.identifier;
          const productTitle = pkg.product.title;
          const productType = pkg.product.productType;

          console.log(`🔍 [Credit Page] Package ${index + 1}:`, {
            id: productId,
            title: productTitle,
            price: pkg.product.priceString,
            type: productType,
            packageType: pkg.packageType,
          });

          // 特别检查 AIPoints_100
          if (productId === 'AIPoints_100') {
            console.log('🎯 [Credit Page] Found AIPoints_100!', {
              productId,
              productType,
              packageType: pkg.packageType,
              price: pkg.product.priceString,
              title: pkg.product.title
            });
          }

          // 只添加积分产品（AIPoints）
          if (productId.includes('AIPoints')) {
            const credits = extractCreditsFromProductId(productId);
            const discount = getPackageDiscount(pkg);

            console.log(`  ✅ Added AIPoints product: ${productId} (${credits} credits, ${pkg.product.priceString})`);
            console.log(`  ✅ Discount: ${discount || 'none'}`);

            packages.push({
              package: pkg,
              credits,
              discount,
            });
          } else {
            console.log(`  ⏭️ Skipped (not AIPoints): ${productId}`);
          }
        });
      });

      console.log('📦 [Credit Page] Total AIPoints packages found:', packages.length);
      console.log('📦 [Credit Page] Package IDs:', packages.map(p => p.package.product.identifier).join(', '));

      // 检查是否包含 AIPoints_100
      const hasAIPoints100 = packages.some(p => p.package.product.identifier === 'AIPoints_100');
      console.log('📦 [Credit Page] Contains AIPoints_100:', hasAIPoints100);

      if (hasAIPoints100) {
        const aiPoints100 = packages.find(p => p.package.product.identifier === 'AIPoints_100');
        console.log('📦 [Credit Page] AIPoints_100 details:', {
          credits: aiPoints100?.credits,
          discount: aiPoints100?.discount,
          price: aiPoints100?.package.product.priceString
        });
      }

      // 按积分数量排序
      packages.sort((a, b) => a.credits - b.credits);
      setCreditPackages(packages);

    } catch (error) {
      console.error('📦 [Credit Page] Failed to load credit packages:', error);
    }
  };


  // 从产品ID提取积分数量
  const extractCreditsFromProductId = (productId: string): number => {
    const match = productId.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  };

  // 获取折扣标签
  const getPackageDiscount = (pkg: PurchasesPackage): string | null => {
    const productId = pkg.product.identifier;

    if (productId.includes('600')) return '16% off';
    if (productId.includes('1200')) return '16% off';
    if (productId.includes('2000')) return '25% off';
    if (productId.includes('3800')) return '35% off';
    if (productId.includes('10000')) return '50% off';

    return '';
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
    loadCreditPackages()
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

  // 购买积分包
  const handlePurchaseCredits = async (creditPackage: CreditPackage) => {
    try {
      Alert.alert(
        'Purchase Credits',
        `Are you sure you want to purchase ${creditPackage.credits} credits for ${creditPackage.package.product.priceString}?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Purchase',
            onPress: async () => {
              try {
                console.log('🔄 Starting purchase...');

                // 记录购买前的积分余额
                const creditsBefore = credits?.available_credits || 0;

                // 1. 通过 RevenueCat 购买
                const result = await purchase(creditPackage.package);

                // 验证购买结果
                const purchaseValidation = validatePurchaseResult(result);
                console.log(purchaseValidation.success ? '✅' : '❌', 'Phase 1:', purchaseValidation.message);

                if (!purchaseValidation.success) {
                  throw new Error(purchaseValidation.message);
                }

                // 2. 同步到数据库（自动添加积分）
                const payment = await createPaymentFromRevenueCat(
                  result.customerInfo,
                  creditPackage.package
                );

                // 验证数据库同步
                const syncValidation = validateDatabaseSync(
                  payment,
                  creditPackage.package.product.identifier
                );
                console.log(syncValidation.success ? '✅' : '⚠️', 'Phase 2:', syncValidation.message);

                // 3. 刷新数据
                await refresh(); // 刷新 RevenueCat 数据
                await refreshCredits(); // 刷新积分余额
                await refreshPayments(); // 刷新购买记录

                // 等待一小段时间让数据更新
                await new Promise(resolve => setTimeout(resolve, 500));

                // 获取更新后的积分余额（从 state 获取最新值）
                // 注意：由于 React state 更新可能异步，这里使用购买前余额 + 购买数量作为预期
                const expectedCreditsAfter = creditsBefore + creditPackage.credits;

                console.log(`✅ Phase 3: Expected credits increase from ${creditsBefore} to ${expectedCreditsAfter}`);

                // 根据验证结果显示消息
                if (purchaseValidation.success && syncValidation.success) {
                  // 所有步骤成功
                  console.log('🎉 All phases completed successfully!');

                  Alert.alert(
                    'Purchase Successful!',
                    `You have successfully purchased ${creditPackage.credits} credits.\n\nYour new balance: ${expectedCreditsAfter} credits`,
                    [
                      {
                        text: 'OK',
                        onPress: () => {
                          refreshPayments();
                        }
                      }
                    ]
                  );
                } else if (purchaseValidation.success) {
                  // 购买成功但同步有问题
                  console.warn('⚠️ Purchase successful but sync had issues');

                  Alert.alert(
                    'Purchase Completed',
                    'Your purchase is successful. Data is syncing in the background.',
                    [
                      {
                        text: 'OK',
                        onPress: () => {
                          refreshPayments();
                        }
                      }
                    ]
                  );
                } else {
                  // 购买失败
                  throw new Error('Purchase validation failed');
                }

              } catch (error: any) {
                if (isUserCancelledError(error)) {
                  console.log('ℹ️ User cancelled purchase');
                  return;
                }

                console.error('❌ Purchase error:', error);
                Alert.alert('Purchase Failed', 'Unable to complete your purchase. Please try again.');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('❌ Purchase credits error:', error);
      Alert.alert('Error', 'An error occurred. Please try again.');
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
            <TouchableOpacity
              onPress={() => router.push("/tabs/my/manageSub")}
              className="p-2"
            >
              <MaterialCommunityIcons name="information-outline" size={24} color="black" />
            </TouchableOpacity>
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
                  {(productInfo && productInfo.isSubscription) ? 'Premium' : 'Try Premium'}
                </Text>

                {productInfo && productInfo.isSubscription
                  ? <><Text className="text-orange-700 text-lg mb-2">
                    1000 Free Credits/Month
                  </Text>
                    <View className="mt-2">
                      <Text className="text-gray-600 text-sm font-semibold">
                        {productInfo.name}
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
        {creditPackages.length > 0 && (
          <View className="px-6 mb-6">
            <View className="flex-row items-center justify-between my-2">
              <Text className="text-xl font-bold text-gray-900">Get More Credits</Text>

              <View className="flex-row items-center justify-center bg-gray-100 rounded-full px-2 py-1">
                <MaterialCommunityIcons name="star-outline" size={22} color="#FFA500" />
                <Text className="text-base text-black mx-1">{credits?.available_credits || 0}</Text>
              </View>
            </View>

            <View className="flex-row flex-wrap justify-between">
              {creditPackages.map((creditPkg, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handlePurchaseCredits(creditPkg)}
                  disabled={purchasing}
                  className="w-[32%] bg-white border border-gray-200 rounded-xl p-4 mb-4"
                >

                  <Text className="text-orange-500 text-xs font-semibold mb-2">{creditPkg.discount}</Text>


                  <View className="flex-row items-center mb-3">
                    <MaterialCommunityIcons name="star" size={20} color="#fbbf24" />
                    <Text className="text-lg font-bold text-black ml-2">{creditPkg.credits}</Text>
                  </View>

                  <View className={`rounded-lg py-2 ${purchasing ? 'bg-gray-400' : 'bg-orange-500'}`}>
                    {purchasing ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <Text className="text-white text-center font-semibold">
                        {creditPkg.package.product.priceString}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

      </ScrollView>

      {/* BaseSix Bottom Sheet Modal (65% screen height) */}
      <Modal
        visible={showPaywallModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPaywallModal(false)}
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
            <BaseSix isPaywall={true} />
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

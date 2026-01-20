import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePurchase, useSubscription, useOfferings } from '@/hooks/useRevenueCat';
import { PurchasesPackage } from 'react-native-purchases';
import { useCreatePayment, useCredits, usePayments } from '@/hooks/usePayment';
import { 
  validatePurchaseResult, 
  validateDatabaseSync, 
  isUserCancelledError
} from '@/utils/purchaseValidation';
import revenueCatService from '@/services/RevenueCatService';
import { Payment } from '@/types/payment';
import { analytics } from '@/services/AnalyticsService';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

interface PurchaseItem {
  id: string;
  item: string;
  productId: string;
  price?: string;
  date: string;
  status: 'Active' | 'Expired' | 'Completed' | 'Pending';
  type: 'Subscription' | 'Credits' | 'OneTime';
  expirationDate?: string;
}

interface CreditPackage {
  package: PurchasesPackage;
  credits: number;
  discount: string | null;
}

export default function CreditManagement() {
  const { restore, restoring, purchase, purchasing } = usePurchase();
  const { customerInfo, loading, refresh } = useSubscription();
  const { currentOffering, loading: offeringsLoading, error: offeringsError, refresh: refreshOfferings } = useOfferings();
  const { createPaymentFromRevenueCat } = useCreatePayment();
  const { credits, refresh: refreshCredits } = useCredits();
  const { payments, loading: paymentsLoading, refresh: refreshPayments } = usePayments(); // 从 Supabase 加载
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseItem[]>([]);
  const [creditPackages, setCreditPackages] = useState<CreditPackage[]>([]);

  // 页面浏览追踪
  useFocusEffect(
    useCallback(() => {
      analytics.page('credit_management', {
        category: 'settings',
        section: 'my',
      });
    }, [])
  );

  // 初始化 RevenueCat 数据
  useEffect(() => {
    const forceRefresh = async () => {
      try {
        const isInit = revenueCatService.isInitialized();
        if (!isInit) {
          await revenueCatService.initialize();
        }
        await loadCreditPackages();
      } catch (error) {
        // 静默失败
      }
    };

    // 延迟 3 秒后执行，确保 RevenueCat 已初始化
    const timer = setTimeout(forceRefresh, 3000);
    return () => clearTimeout(timer);
  }, []);

  // 从 Supabase 加载购买历史
  useEffect(() => {
    if (!paymentsLoading && payments.length >= 0) {
      loadPurchaseHistoryFromSupabase();
    }
  }, [payments, paymentsLoading]);

  // 加载可购买的积分包
  useEffect(() => {
    loadCreditPackages();
  }, []);

  const loadCreditPackages = async () => {
    try {
      // 获取所有 Offerings
      const allOfferings = await revenueCatService.getOfferings();

      const packages: CreditPackage[] = [];

      // 遍历所有 Offerings 寻找积分产品
      Object.values(allOfferings.all).forEach((offering) => {
        offering.availablePackages.forEach((pkg) => {
          const productId = pkg.product.identifier;

          // 只添加积分产品（AIPoints）
          if (productId.includes('AIPoints')) {
            const credits = extractCreditsFromProductId(productId);
            const discount = getPackageDiscount(pkg);

            packages.push({
              package: pkg,
              credits,
              discount,
            });
          }
        });
      });

      // 按积分数量排序
      packages.sort((a, b) => a.credits - b.credits);
      setCreditPackages(packages);

    } catch (error) {
      // 静默失败
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

  // 从 Supabase 数据库加载购买历史
  const loadPurchaseHistoryFromSupabase = () => {
    if (payments.length === 0) {
      setPurchaseHistory([]);
      return;
    }

    const purchases: PurchaseItem[] = [];

    payments.forEach((payment) => {
      // 只添加积分产品（非订阅产品）
      const isCreditProduct = payment.product_type === 'credits' ||
                             (payment.credits_amount > 0 && !payment.is_subscription);

      if (isCreditProduct) {
        purchases.push({
          id: payment.id,
          item: payment.product_name || getProductName(payment.product_id),
          productId: payment.product_id,
          price: payment.price_string,
          date: formatDate(payment.purchase_date),
          status: mapPaymentStatus(payment.status),
          type: 'Credits',
        });
      }
    });

    // 按日期排序（最新的在前）
    purchases.sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    setPurchaseHistory(purchases);
  };

  // 映射支付状态到显示状态
  const mapPaymentStatus = (status: string): 'Active' | 'Expired' | 'Completed' | 'Pending' => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'pending':
        return 'Pending';
      case 'failed':
      case 'cancelled':
        return 'Expired';
      case 'refunded':
        return 'Expired';
      default:
        return 'Completed';
    }
  };

  // 产品名称映射
  const getProductName = (productId: string): string => {
    const nameMap: Record<string, string> = {

      'AIPoints_100': '100 Credits',
      'AIPoints_600': '600 Credits',
      'AIPoints_1200': '1200 Credits',
      'AIPoints_2000': '2000 Credits',
      'AIPoints_3800': '3800 Credits',
      'AIPoints_10000': '10000 Credits',
    };
    
    return nameMap[productId] || productId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // 格式化日期
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Unknown';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
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
                // 追踪购买开始
                await analytics.track('purchase_started', {
                  product_id: creditPackage.package.product.identifier,
                  product_type: 'credits',
                  credits: creditPackage.credits,
                  price: creditPackage.package.product.price,
                  currency: creditPackage.package.product.currencyCode || 'USD',
                  discount: creditPackage.discount || null,
                  source: 'credit_management_page',
                });
                
                // 记录购买前的积分余额
                const creditsBefore = credits?.available_credits || 0;
                
                // 1. 通过 RevenueCat 购买
                const result = await purchase(creditPackage.package);
                
                // 验证购买结果
                const purchaseValidation = validatePurchaseResult(result);

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

                // 3. 刷新数据
                await refresh(); // 刷新 RevenueCat 数据
                await refreshCredits(); // 刷新积分余额
                await refreshPayments(); // 刷新购买记录
                
                // 等待一小段时间让数据更新
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // 获取更新后的积分余额（从 state 获取最新值）
                const expectedCreditsAfter = creditsBefore + creditPackage.credits;

                // 根据验证结果显示消息
                if (purchaseValidation.success && syncValidation.success) {
                  // 所有步骤成功
                  
                  // 追踪购买成功
                  await analytics.trackPurchase(
                    creditPackage.package.product.identifier,
                    creditPackage.package.product.price,
                    creditPackage.package.product.currencyCode || 'USD',
                    1,
                    {
                      credits: creditPackage.credits,
                      credits_before: creditsBefore,
                      credits_after: expectedCreditsAfter,
                      discount: creditPackage.discount || null,
                      purchase_sync_status: 'success',
                      source: 'credit_management_page',
                    }
                  );
                  
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
                  // 追踪购买成功但同步失败
                  await analytics.trackPurchase(
                    creditPackage.package.product.identifier,
                    creditPackage.package.product.price,
                    creditPackage.package.product.currencyCode || 'USD',
                    1,
                    {
                      credits: creditPackage.credits,
                      credits_before: creditsBefore,
                      credits_after: expectedCreditsAfter,
                      discount: creditPackage.discount || null,
                      purchase_sync_status: 'partial',
                      source: 'credit_management_page',
                    }
                  );
                  
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
                  // 追踪用户取消
                  await analytics.track('purchase_cancelled', {
                    product_id: creditPackage.package.product.identifier,
                    product_type: 'credits',
                    credits: creditPackage.credits,
                    source: 'credit_management_page',
                  });
                  return;
                }

                // 追踪购买失败
                await analytics.track('purchase_failed', {
                  product_id: creditPackage.package.product.identifier,
                  product_type: 'credits',
                  credits: creditPackage.credits,
                  error: error?.message || 'Unknown error',
                  source: 'credit_management_page',
                });
                
                Alert.alert('Purchase Failed', 'Unable to complete your purchase. Please try again.');
              }
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'An error occurred. Please try again.');
    }
  };


  // 查看购买详情
  const handleViewDetails = (purchase: PurchaseItem) => {
    let details = `Product: ${purchase.item}\n`;
    details += `Product ID: ${purchase.productId}\n`;
    details += `Type: ${purchase.type}\n`;
    details += `Status: ${purchase.status}\n`;
    details += `Purchase Date: ${purchase.date}\n`;
    
    if (purchase.expirationDate) {
      details += `Expiration: ${formatDate(purchase.expirationDate)}\n`;
    }
    
    Alert.alert('Purchase Details', details, [{ text: 'OK' }]);
  };

  // 获取类型图标
  const getTypeIcon = (type: string) => {
    let iconName: any = 'shopping';
    let color = '#9ca3af';
    
    if (type === 'Subscription') {
      iconName = 'crown';
      color = '#f59e0b';
    } else if (type === 'Credits') {
      iconName = 'star';
      color = '#fbbf24';
    } else if (type === 'OneTime') {
      iconName = 'shopping';
      color = '#3b82f6';
    }
    
    return (
      <MaterialCommunityIcons 
        name={iconName} 
        size={16} 
        color={color} 
      />
    );
  };

  // 查看完整积分数据（开发调试用）
  const handleViewRawData = () => {
    if (!credits) {
      Alert.alert('No Data', 'Credits information is not available');
      return;
    }

    const data = {
      credits: {
        total: credits.total_credits,
        used: credits.used_credits,
        available: credits.available_credits,
        purchased: credits.total_purchased,
        earned: credits.total_earned,
      },
      creditsPurchases: purchaseHistory.length,
      packages: creditPackages.length,
    };

    Alert.alert(
      'Credits Information',
      `Available: ${credits.available_credits}\n` +
      `Total Earned: ${credits.total_credits}\n` +
      `Used: ${credits.used_credits}\n` +
      `Purchased: ${credits.total_purchased}\n\n` +
      `Credit Purchases: ${purchaseHistory.length}\n\n` +
      `Full data logged to console.`,
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-white">
      {/* Header */}
      <View className="px-6 pt-4 pb-2">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <MaterialCommunityIcons name="arrow-left" size={24} color="black" />
          </TouchableOpacity>
          <Text className="text-xl font-bold">Credits Store</Text>
          <TouchableOpacity onPress={handleViewRawData} className="p-2">
            <MaterialCommunityIcons name="information-outline" size={24} color="black" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Loading State */}
        {(loading || paymentsLoading) ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text className="text-gray-600 mt-4">Loading purchase history...</Text>
          </View>
        ) : (
          <>
            {/* Credits Balance Card */}
            <View className="px-6 mb-6">
              <View className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border border-orange-200" style={{ marginTop: 24 }}>
                <View className="flex-row items-center justify-between mb-4">
                  <View className="flex-1">
                    <Text className="text-sm text-orange-700 mb-1">Available Credits</Text>
                    <Text className="text-4xl font-bold text-orange-900">
                      {credits?.available_credits || 0}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="star" size={64} color="#fbbf24" />
                </View>
                
                {credits && (
                  <View className="flex-row justify-between mt-2 pt-3 border-t border-orange-200">
                    <View>
                      <Text className="text-orange-700 text-xs">Total Earned</Text>
                      <Text className="text-orange-900 font-bold mt-1">
                        {credits.total_credits}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-orange-700 text-xs">Used</Text>
                      <Text className="text-orange-900 font-bold mt-1">
                        {credits.used_credits}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-orange-700 text-xs">Purchased</Text>
                      <Text className="text-orange-900 font-bold mt-1">
                        {credits.total_purchased}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* Buy Credits Section */}
            {creditPackages.length > 0 && (
              <View className="px-6 mb-6">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-xl font-bold text-gray-900">Get more credits</Text>
                  <View className="flex-row items-center">
                    <MaterialCommunityIcons name="star" size={20} color="#fbbf24" />
                    <Text className="text-lg font-bold text-gray-900 ml-1">
                      {credits?.available_credits || 0}
                    </Text>
                  </View>
                </View>
                <View className="flex-row flex-wrap">
                  {creditPackages.map((creditPkg, index) => {
                    const isLastInRow = (index + 1) % 3 === 0;
                    const isLastRow = index >= creditPackages.length - 3;
                    return (
                      <TouchableOpacity
                        key={index}
                        onPress={() => handlePurchaseCredits(creditPkg)}
                        disabled={purchasing}
                        className="bg-white border border-gray-200 rounded-[10px] p-4"
                        style={{ 
                          width: '31%',
                          aspectRatio: 1,
                          marginRight: isLastInRow ? 0 : 8,
                          marginBottom: isLastRow ? 0 : 8,
                        }}
                      >
                        <View className="flex-1 justify-between">
                          <View className="flex-row items-center justify-center mb-2">
                            <MaterialCommunityIcons name="star" size={20} color="#fbbf24" />
                            <Text className="text-lg font-bold text-black ml-2">{creditPkg.credits}</Text>
                          </View>
                          
                          <View className={`rounded-full py-2 ${purchasing ? 'bg-gray-400' : 'bg-orange-500'}`}>
                            {purchasing ? (
                              <ActivityIndicator color="white" size="small" />
                            ) : (
                              <Text className="text-white text-center font-semibold text-sm">
                                {creditPkg.package.product.priceString}
                              </Text>
                            )}
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Loading Credits */}
            {offeringsLoading && creditPackages.length === 0 && (
              <View className="px-6 mb-6">
                <View className="bg-gray-50 rounded-xl p-6 items-center">
                  <ActivityIndicator size="large" color="#3b82f6" />
                  <Text className="text-gray-600 mt-3">Loading credit packages...</Text>
                </View>
              </View>
            )}

            {/* No Products Error */}
            {!offeringsLoading && creditPackages.length === 0 && (
              <View className="px-6 mb-6">
                <View className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                  <View className="flex-row items-center mb-2">
                    <MaterialCommunityIcons name="alert-circle" size={24} color="#f97316" />
                    <Text className="text-lg font-bold text-orange-900 ml-2">
                      No Credit Products Found
                    </Text>
                  </View>
                  <Text className="text-orange-800 text-sm mb-3">
                    {currentOffering 
                      ? `Offering has ${currentOffering.availablePackages.length} products, but no AIPoints products`
                      : 'RevenueCat Offering is empty'}
                  </Text>
                  <Text className="text-orange-700 text-xs mb-2">
                    Please check:{'\n'}
                    1. Are Offerings created in RevenueCat Dashboard?{'\n'}
                    2. Does the Offering include AIPoints products?{'\n'}
                    3. Are product IDs correctly matched?
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      refreshOfferings();
                    }}
                    className="bg-orange-500 py-2 px-4 rounded-lg mt-2"
                  >
                    <Text className="text-white font-bold text-center">Reload Products</Text>
                  </TouchableOpacity>
                  
                  {/* Debug 按钮 */}
                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert(
                        'Debug Info',
                        `Initialized: ${revenueCatService.isInitialized()}\n` +
                        `Offering: ${currentOffering ? 'Yes' : 'No'}\n` +
                        `Packages: ${currentOffering?.availablePackages.length || 0}\n` +
                        `Error: ${offeringsError?.message || 'None'}`,
                        [{ text: 'OK' }]
                      );
                    }}
                    className="border border-orange-300 py-2 px-4 rounded-lg mt-2"
                  >
                    <Text className="text-orange-700 font-bold text-center">View Debug Info</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Credits Purchase History */}
            <View className="px-6 mb-6" style={{ marginTop: 24 }}>
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-semibold text-gray-900">Credits Purchase History</Text>
                <TouchableOpacity onPress={() => refreshPayments()}>
                  <MaterialCommunityIcons name="refresh" size={20} color="#f59e0b" />
                </TouchableOpacity>
              </View>
              
              <View className="bg-white rounded-xl border border-gray-200">
                {purchaseHistory.length > 0 ? (
                  purchaseHistory.slice(0, 5).map((purchase, index) => (
                    <TouchableOpacity
                      key={purchase.id}
                      onPress={() => handleViewDetails(purchase)}
                      className={`p-4 ${index < Math.min(5, purchaseHistory.length) - 1 ? 'border-b border-gray-100' : ''}`}
                    >
                      <View className="flex-row justify-between items-start">
                        <View className="flex-1 mr-3">
                          <View className="flex-row items-center mb-1">
                            <Text className="font-semibold text-gray-900 flex-1">{purchase.item}</Text>
                            {getTypeIcon(purchase.type)}
                          </View>
                          
                          <Text className="text-gray-600 text-xs mb-2">{purchase.date}</Text>
                          
                          <View className="flex-row items-center flex-wrap">
                            <View className={`px-2 py-1 rounded-full mr-2 mb-1 ${
                              purchase.status === 'Active' 
                                ? 'bg-green-100' 
                                : purchase.status === 'Expired'
                                ? 'bg-red-100'
                                : 'bg-gray-100'
                            }`}>
                              <Text className={`text-xs font-medium ${
                                purchase.status === 'Active' 
                                  ? 'text-green-800' 
                                  : purchase.status === 'Expired'
                                  ? 'text-red-800'
                                  : 'text-gray-600'
                              }`}>
                                {purchase.status}
                              </Text>
                            </View>
                            
                            <View className="px-2 py-1 rounded-full bg-blue-50 mb-1">
                              <Text className="text-xs font-medium text-blue-700">
                                {purchase.type}
                              </Text>
                            </View>
                          </View>
                          
                          {purchase.expirationDate && purchase.status === 'Active' && (
                            <Text className="text-xs text-gray-500 mt-1">
                              Expires: {formatDate(purchase.expirationDate)}
                            </Text>
                          )}
                        </View>
                        
                        <MaterialCommunityIcons name="chevron-right" size={20} color="#9ca3af" />
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View className="p-8 items-center">
                    <MaterialCommunityIcons name="star-outline" size={64} color="#fbbf24" />
                    <Text className="text-gray-500 mt-3 text-center font-semibold">No Credits Purchased Yet</Text>
                    <Text className="text-gray-400 text-sm mt-1 text-center">
                      Purchase credits above to start using AI features
                    </Text>
                  </View>
                )}
                
                {/* 显示记录数量提示 */}
                {purchaseHistory.length > 5 && (
                  <View className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                    <Text className="text-xs text-gray-500 text-center">
                      Showing latest 5 records, {purchaseHistory.length} total purchase records
                    </Text>
                  </View>
                )}
              </View>
            </View>


            {/* Information */}
            <View className="px-6 mb-6" style={{ marginTop: 24 }}>
              <View className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <View className="flex-row items-start">
                  <MaterialCommunityIcons name="information" size={20} color="#3b82f6" />
                  <View className="ml-3 flex-1">
                    <Text className="text-blue-900 font-semibold mb-1">How Credits Work</Text>
                    <Text className="text-blue-700 text-sm">
                      Credits are used for AI features like outfit generation. Premium subscribers get 1000 free credits monthly. Purchase more credits anytime to keep using AI features.
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

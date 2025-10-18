import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePurchase, useSubscription, useOfferings } from '@/hooks/useRevenueCat';
import { PurchasesPackage } from 'react-native-purchases';
import { useCreatePayment, useCredits } from '@/hooks/usePayment';
import { 
  validatePurchaseResult, 
  validateDatabaseSync, 
  isUserCancelledError
} from '@/utils/purchaseValidation';
import revenueCatService from '@/services/RevenueCatService';

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
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseItem[]>([]);
  const [creditPackages, setCreditPackages] = useState<CreditPackage[]>([]);

  // Debug: 输出 offerings 信息
  useEffect(() => {
    console.log('🔍 [Credit Page] RevenueCat 初始化状态:', revenueCatService.isInitialized());
    console.log('🔍 [Credit Page] Current Offering:', currentOffering);
    console.log('🔍 [Credit Page] Offerings Loading:', offeringsLoading);
    console.log('🔍 [Credit Page] Offerings Error:', offeringsError);
    
    if (currentOffering) {
      console.log('🔍 [Credit Page] Offering ID:', currentOffering.identifier);
      console.log('🔍 [Credit Page] Offering Description:', currentOffering.serverDescription);
      console.log('🔍 [Credit Page] Available Packages:', currentOffering.availablePackages.length);
      
      currentOffering.availablePackages.forEach((pkg, index) => {
        console.log(`  ${index + 1}. Product ID: ${pkg.product.identifier}`);
        console.log(`     Title: ${pkg.product.title}`);
        console.log(`     Price: ${pkg.product.priceString}`);
        console.log(`     Type: ${pkg.product.productType}`);
        console.log(`     Package Type: ${pkg.packageType}`);
        console.log('     ---');
      });
    } else {
      console.log('🔍 [Credit Page] No current offering available');
    }
  }, [currentOffering, offeringsLoading, offeringsError]);

  // 强制刷新 RevenueCat 数据（调试用）
  useEffect(() => {
    const forceRefresh = async () => {
      console.log('🔄 [Credit Page] 强制刷新 RevenueCat 数据...');
      try {
        // 检查初始化状态
        const isInit = revenueCatService.isInitialized();
        console.log('🔄 [Credit Page] RevenueCat 初始化状态:', isInit);
        
        if (!isInit) {
          console.log('🔄 [Credit Page] RevenueCat 未初始化，尝试重新初始化...');
          await revenueCatService.initialize();
        }
        
        // 重新加载积分包
        await loadCreditPackages();
      } catch (error) {
        console.error('🔄 [Credit Page] 强制刷新失败:', error);
        console.error('🔄 [Credit Page] 错误详情:', (error as Error).message);
      }
    };
    
    // 延迟 3 秒后执行，确保 RevenueCat 已初始化
    const timer = setTimeout(forceRefresh, 3000);
    return () => clearTimeout(timer);
  }, []);

  // 从 RevenueCat 加载购买历史
  useEffect(() => {
    if (customerInfo) {
      loadPurchaseHistory();
    }
  }, [customerInfo]);

  // 加载可购买的积分包
  useEffect(() => {
    loadCreditPackages();
  }, []);

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

  const loadPurchaseHistory = () => {
    if (!customerInfo) return;

    const purchases: PurchaseItem[] = [];
    let index = 0;

    // 只加载积分购买历史（非订阅购买）
    const nonSubscriptions = customerInfo.nonSubscriptionTransactions || [];
    nonSubscriptions.forEach((transaction) => {
      // 只添加积分产品
      if (isCreditsProduct(transaction.productIdentifier)) {
        purchases.push({
          id: `credit_${index++}`,
          item: getProductName(transaction.productIdentifier),
          productId: transaction.productIdentifier,
          date: formatDate(transaction.purchaseDate),
          status: 'Completed',
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

  // 判断是否是积分产品
  const isCreditsProduct = (productId: string): boolean => {
    return productId.includes('credit') || 
           productId.includes('coin') || 
           productId.includes('AIPoints') ||
           productId.includes('point');
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
                          loadPurchaseHistory();
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
                          loadPurchaseHistory();
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

  const handleRestore = async () => {
    try {
      const customerInfo = await restore();
      await refresh(); // 刷新订阅状态
      
      // 检查是否有购买记录
      const hasSubscriptions = Object.keys(customerInfo.entitlements.all).length > 0;
      const hasNonSubscriptions = (customerInfo.nonSubscriptionTransactions || []).length > 0;
      
      if (hasSubscriptions || hasNonSubscriptions) {
        Alert.alert(
          'Success', 
          `Purchases restored successfully!\n\nFound ${Object.keys(customerInfo.entitlements.all).length} subscriptions and ${(customerInfo.nonSubscriptionTransactions || []).length} other purchases.`
        );
        loadPurchaseHistory(); // 重新加载购买历史
      } else {
        Alert.alert('No Purchases Found', 'We could not find any previous purchases for this account.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
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

    console.log('📊 Complete Credits Data:', JSON.stringify(data, null, 2));
    
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
        {loading ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text className="text-gray-600 mt-4">Loading purchase history...</Text>
          </View>
        ) : (
          <>
            {/* Credits Balance Card */}
            <View className="px-6 mb-6">
              <View className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border border-orange-200">
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
                <Text className="text-xl font-bold text-gray-900 mb-4">Buy More Credits</Text>
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
                      未找到积分产品
                    </Text>
                  </View>
                  <Text className="text-orange-800 text-sm mb-3">
                    {currentOffering 
                      ? `Offering 中有 ${currentOffering.availablePackages.length} 个产品，但没有 AIPoints 产品`
                      : 'RevenueCat Offering 为空'}
                  </Text>
                  <Text className="text-orange-700 text-xs mb-2">
                    请检查：{'\n'}
                    1. RevenueCat 控制台是否创建了 Offerings{'\n'}
                    2. Offering 中是否包含 AIPoints 产品{'\n'}
                    3. 产品 ID 是否正确匹配
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      console.log('🔄 手动刷新 offerings...');
                      refreshOfferings();
                    }}
                    className="bg-orange-500 py-2 px-4 rounded-lg mt-2"
                  >
                    <Text className="text-white font-bold text-center">重新加载产品</Text>
                  </TouchableOpacity>
                  
                  {/* Debug 按钮 */}
                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert(
                        'Debug Info',
                        `初始化: ${revenueCatService.isInitialized()}\n` +
                        `Offering: ${currentOffering ? '有' : '无'}\n` +
                        `Packages: ${currentOffering?.availablePackages.length || 0}\n` +
                        `Error: ${offeringsError?.message || '无'}`,
                        [{ text: '确定' }]
                      );
                    }}
                    className="border border-orange-300 py-2 px-4 rounded-lg mt-2"
                  >
                    <Text className="text-orange-700 font-bold text-center">查看调试信息</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Credits Purchase History */}
            <View className="px-6 mb-6">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-semibold text-gray-900">Credits Purchase History</Text>
                <TouchableOpacity onPress={() => refresh()}>
                  <MaterialCommunityIcons name="refresh" size={20} color="#f59e0b" />
                </TouchableOpacity>
              </View>
              
              <View className="bg-white rounded-xl border border-gray-200">
                {purchaseHistory.length > 0 ? (
                  purchaseHistory.map((purchase, index) => (
                    <TouchableOpacity
                      key={purchase.id}
                      onPress={() => handleViewDetails(purchase)}
                      className={`p-4 ${index < purchaseHistory.length - 1 ? 'border-b border-gray-100' : ''}`}
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
              </View>
            </View>

            {/* Quick Actions */}
            {/* <View className="px-6 mb-6">
              <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <TouchableOpacity
                  onPress={handleRestore}
                  disabled={restoring}
                  className="flex-row items-center justify-between py-3"
                >
                  <View className="flex-row items-center">
                    <MaterialCommunityIcons name="restore" size={24} color="#f59e0b" />
                    <Text className="text-base font-semibold text-gray-900 ml-3">
                      Restore Credits Purchases
                    </Text>
                  </View>
                  {restoring ? (
                    <ActivityIndicator color="#f59e0b" size="small" />
                  ) : (
                    <MaterialCommunityIcons name="chevron-right" size={24} color="#9ca3af" />
                  )}
                </TouchableOpacity>
              </View>
            </View> */}

            {/* Information */}
            <View className="px-6 mb-6">
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

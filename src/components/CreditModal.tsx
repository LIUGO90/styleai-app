import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import revenueCatService from '@/services/RevenueCatService';
import { useCredits } from '@/hooks/usePayment';
import paymentService from '@/services/PaymentService';
import { PurchasesPackage } from '@revenuecat/purchases-typescript-internal';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

interface CreditModalProps {
  visible: boolean;
  onClose: () => void;
}

interface CreditProduct {
  package: PurchasesPackage;
  credits: number;
  price: string;
  productId: string;
}

export const CreditModal: React.FC<CreditModalProps> = ({ visible, onClose }) => {
  const { user } = useAuth();
  const router = useRouter();
  const { credits, loading, refresh: refreshCredits } = useCredits();
  const [creditProducts, setCreditProducts] = useState<CreditProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<CreditProduct | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(0.3));
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      refreshCredits(); // 刷新积分
      loadCreditProducts(); // 加载积分产品
      // 弹出动画 - 缩放 + 淡入
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 10,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // 关闭动画 - 缩小 + 淡出
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.3,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  // 监听积分变化并输出日志
  useEffect(() => {
    if (credits) {
      console.log('💰 [CreditModal] 积分信息:', {
        available: credits.available_credits,
        total: credits.total_credits,
        used: credits.used_credits,
        purchased: credits.total_purchased,
        earned: credits.total_earned,
      });
    }
  }, [credits]);

  const loadCreditProducts = async () => {
    console.log('📦 [CreditModal] 开始查询积分产品...');
    setLoadingProducts(true);
    
    try {
      // 获取所有 Offerings
      const allOfferings = await revenueCatService.getOfferings();
      console.log('🔍 [TestFlight Debug] Current Offering:', allOfferings.current?.identifier || 'null');
      console.log('🔍 [TestFlight Debug] All Offerings:', Object.keys(allOfferings.all));
      
      // 检查是否有 Offerings
      if (!allOfferings || Object.keys(allOfferings.all).length === 0) {
        console.error('❌ [TestFlight Debug] 没有找到任何 Offerings');
        console.error('💡 解决方案: 在 RevenueCat Dashboard 中配置 Offerings');
        setCreditProducts([]);
        setLoadingProducts(false);
        return;
      }
      
      const products: CreditProduct[] = [];
      
      // 遍历所有 Offerings 查找积分产品
      Object.values(allOfferings.all).forEach((offering: any) => {
        console.log(`📦 [TestFlight Debug] 检查 Offering: ${offering.identifier}, 产品数量: ${offering.availablePackages.length}`);
        
        offering.availablePackages.forEach((pkg: any) => {
          const productId = pkg.product.identifier;
          console.log(`   - 产品: ${productId} (${pkg.product.title})`);
          
          // 只添加 AIPoints 产品
          if (productId.includes('AIPoints')) {
            const match = productId.match(/AIPoints[_-]?(\d+)/i);
            const credits = match ? parseInt(match[1], 10) : 0;
            
            // console.log(`✅ [CreditModal] 找到积分产品: ${productId} (${credits} 积分, ${pkg.product.priceString})`);
            
            products.push({
              package: pkg,
              credits,
              price: pkg.product.priceString,
              productId,
            });
          }
        });
      });
      
      // 按积分数量排序（从少到多）
      products.sort((a, b) => a.credits - b.credits);
      
      console.log('🔍 [TestFlight Debug] 共找到', products.length, '个积分产品');
      if (products.length === 0) {
        console.error('❌ [TestFlight Debug] 没有找到任何 AIPoints 产品！');
        console.log('💡 解决方案: 在 RevenueCat Dashboard 中将包含 AIPoints 产品的 Offering 设置为 Current');
      } else {
        console.log('✅ [TestFlight Debug] 产品列表:', products.map(p => `${p.productId}(${p.credits}积分-${p.price})`));
      }
      
      setCreditProducts(products);
    } catch (error) {
      console.error('❌ [CreditModal] 查询积分产品失败:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleBuyCredits = () => {
    onClose();
    // 跳转到积分购买页面
    router.push('/tabs/my/credit');
  };

  const handleSelectProduct = (product: CreditProduct) => {
    setSelectedProduct(product);
    console.log('🎯 [CreditModal] 选择产品:', product.productId);
  };

  const handlePurchaseSelectedProduct = async () => {
    if (!selectedProduct) {
      Alert.alert('Notice', 'Please select a credit package to purchase');
      return;
    }

    try {
      setPurchasing(true);
      console.log('🛒 [CreditModal] 开始购买积分产品:', selectedProduct.productId);
      
      // 调用 RevenueCat 购买
      const result = await revenueCatService.purchasePackage(selectedProduct.package);
      
      console.log('✅ [CreditModal] 购买成功:', result.customerInfo);
      
      try {
        // 向数据库写入支付记录（内部会自动添加积分）
        console.log('💾 [CreditModal] 开始写入支付记录...');
        const paymentRecord = await paymentService.createPaymentFromRevenueCat(
          user?.id || '',
          result.customerInfo,
          selectedProduct.package
        );
        
        if (paymentRecord) {
          console.log('✅ [CreditModal] 支付记录和积分添加成功:', paymentRecord.id);
        } else {
          console.warn('⚠️ [CreditModal] 支付记录写入失败');
        }
      } catch (dbError) {
        console.error('❌ [CreditModal] 数据库操作失败:', dbError);
        // 即使数据库操作失败，也不影响用户体验，因为 RevenueCat 已经处理了支付
      }
      
      // 刷新积分信息
      await refreshCredits();
      
      // 清除选择状态
      setSelectedProduct(null);
      
      // 显示成功提示
      Alert.alert(
        'Purchase Successful',
        `You have successfully purchased ${selectedProduct.credits} credits!`,
        [{ text: 'OK', style: 'default' }]
      );
      
    } catch (error: any) {
      // console.error('❌ [CreditModal] 购买异常:', error);
      
      // 检查是否是用户取消
      if (error?.userCancelled || error?.message?.includes('cancelled')) {
        console.log('🚫 [CreditModal] 用户取消了购买');
        return; // 用户取消，不显示错误提示
      }
      
      // 其他错误
      Alert.alert(
        'Purchase Failed',
        error?.message || 'An error occurred during purchase, please try again',
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setPurchasing(false);
    }
  };

  const handleRefresh = () => {
    refreshCredits();
    loadCreditProducts();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
        {/* 背景遮罩 */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={onClose}
          className="absolute inset-0"
        />

        {/* 积分卡片 */}
        <View
          style={{
            width: SCREEN_WIDTH - 80,
            maxWidth: 500,
          }}
        >
          <View
            className="bg-white rounded-3xl shadow-2xl overflow-hidden"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.3,
              shadowRadius: 20,
              elevation: 10,
            }}
          >
            {/* 顶部橙色背景 */}
            <View 
              className="px-6 py-2"
              style={{
                backgroundColor: '#f97316', // orange-500
              }}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Ionicons name="star" size={32} color="white" />
                  <Text className="text-white text-2xl font-bold ml-3">
                    My Credits
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  className="bg-white/20 rounded-full p-2"
                >
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
              </View>

              {/* 积分数量 */}
              <View className="items-center py-2">
                <Text className="text-white/80 text-sm mb-2">Available Credits</Text>
                <View className="flex-row items-baseline">
                  <Text className="text-white text-6xl font-bold">
                    {loading ? '...' : (credits?.available_credits || 0)}
                  </Text>
                  <Text className="text-white/80 text-xl ml-2">Credits</Text>
                </View>
                {loading && (
                  <ActivityIndicator size="small" color="white" style={{ marginTop: 8 }} />
                )}
                {/* 调试信息 */}
                {/* <Text className="text-white/40 text-xs mt-2">
                  调试: loading={loading ? 'true' : 'false'}, credits={credits ? 'exist' : 'null'}
                </Text> */}
              </View>

              {/* 刷新按钮 */}
              <TouchableOpacity
                onPress={handleRefresh}
                className="self-center bg-white/20 px-4 py-2 rounded-full flex-row items-center"
              >
                  <Ionicons name="refresh" size={16} color="white" />
                <Text className="text-white text-sm ml-2">Refresh</Text>
              </TouchableOpacity>
            </View>

            {/* 积分产品列表 */}
            <View className="px-2 py-2 bg-gray-50">
              <Text className="text-gray-900 font-semibold text-base mb-3">
                Available Credit Packages
              </Text>
              
              {loadingProducts ? (
                <View className="py-6 items-center">
                  <ActivityIndicator size="small" color="#f97316" />
                  <Text className="text-gray-500 text-sm mt-2">Loading...</Text>
                </View>
              ) : creditProducts.length > 0 ? (
                <View className="flex-row flex-wrap justify-between">
                  {creditProducts.slice(0, 6).map((product, index) => {
                    const isSelected = selectedProduct?.productId === product.productId;
                    return (
                      <TouchableOpacity 
                        key={product.productId} 
                        className={`rounded-xl p-3 mb-3 ${isSelected ? 'bg-orange-100 border-2 border-orange-400' : 'bg-white'}`}
                        style={{
                          width: '48%', // 2列布局
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: isSelected ? 0.1 : 0.05,
                          shadowRadius: isSelected ? 4 : 2,
                          elevation: isSelected ? 3 : 1,
                        }}
                        onPress={() => handleSelectProduct(product)}
                        activeOpacity={0.7}
                      >
                        <View className="items-center">
                          <View className={`rounded-full p-2 mb-2 ${isSelected ? 'bg-orange-200' : 'bg-orange-100'}`}>
                            <Ionicons name="star" size={16} color="#f97316" />
                          </View>
                          <Text className={`font-medium text-sm text-center ${isSelected ? 'text-orange-900' : 'text-gray-900'}`}>
                            {product.credits} Credits
                          </Text>
                          <Text className={`font-bold text-sm mt-1 ${isSelected ? 'text-orange-700' : 'text-orange-600'}`}>
                            {product.price}
                          </Text>
                          {isSelected && (
                            <View className="mt-1 bg-orange-500 rounded-full px-2 py-1">
                              <Text className="text-white text-xs font-medium">Selected</Text>
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <View className="py-6 items-center">
                  <Ionicons name="alert-circle-outline" size={40} color="#9ca3af" />
                  <Text className="text-gray-500 text-sm mt-2 text-center">
                    No credit products available
                  </Text>
                  <Text className="text-gray-400 text-xs mt-1 text-center">
                    Click refresh to reload
                  </Text>
                </View>
              )}
            </View>

            {/* 底部购买区域 */}
            <View className="px-6 py-2 bg-white my-2">
              {selectedProduct ? (
                <View>
                  {/* 选中产品信息 */}
                  {/* <View className="bg-orange-50 rounded-xl p-4 mb-3 border border-orange-200">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <View className="bg-orange-100 rounded-full p-2 mr-3">
                          <Ionicons name="star" size={18} color="#f97316" />
                        </View>
                        <View>
                          <Text className="text-gray-900 font-semibold text-base">
                            {selectedProduct.credits} 积分
                          </Text>
                          <Text className="text-gray-500 text-sm">
                            {selectedProduct.productId}
                          </Text>
                        </View>
                      </View>
                      <Text className="text-orange-600 font-bold text-lg">
                        {selectedProduct.price}
                      </Text>
                    </View>
                  </View> */}

                  {/* 购买按钮 */}
                  <TouchableOpacity
                    onPress={handlePurchaseSelectedProduct}
                    disabled={purchasing}
                    className={`rounded-xl py-4 items-center flex-row justify-center ${purchasing ? 'bg-gray-400' : 'bg-orange-500'}`}
                    style={{
                      shadowColor: '#f97316',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: purchasing ? 0.1 : 0.3,
                      shadowRadius: 8,
                      elevation: 5,
                    }}
                  >
                    {purchasing ? (
                      <>
                        <ActivityIndicator size="small" color="white" />
                        <Text className="text-white text-lg font-bold ml-2">
                          Purchasing...
                        </Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="card" size={20} color="white" />
                        <Text className="text-white text-lg font-bold ml-2">
                          Buy Now {selectedProduct.price}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  {/* 未选择产品时的提示 */}
                  <View className="bg-gray-50 rounded-xl py-6 items-center border-2 border-dashed border-gray-300">
                    <Ionicons name="hand-left-outline" size={32} color="#9ca3af" />
                    <Text className="text-gray-600 text-base font-medium mt-2 text-center">
                      Please select a credit package
                    </Text>
                    <Text className="text-gray-400 text-sm text-center mt-1">
                      Tap a credit package above to select
                    </Text>
                  </View>
                </View>
              )}

              {credits && credits.available_credits > 0 && (
                <Text className="text-gray-400 text-xs text-center mt-3">
                  Credits are valid forever and can be used anytime
                </Text>
              )}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default CreditModal;


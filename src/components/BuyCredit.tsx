import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { PurchasesPackage } from "react-native-purchases";
import revenueCatService from '@/services/RevenueCatService';
import { validatePurchaseResult, validateDatabaseSync, isUserCancelledError } from "@/utils/purchaseValidation";
import { refresh } from "@react-native-community/netinfo";
import { usePurchase } from "@/hooks/useRevenueCat";
import { useCreatePayment, useCredits, usePayments } from "@/hooks/usePayment";
import { useCredit } from "@/contexts/CreditContext";
import { useCreditsStore } from "@/stores/creditsStore";
import { useAuth } from "@/contexts/AuthContext";
import { analytics } from "@/services/AnalyticsService";




export interface CreditPackage {
    package: PurchasesPackage;
    credits: number;
    discount: string | null;
}


export default function BuyCredit() {
    const [creditPackages, setCreditPackages] = useState<CreditPackage[]>([]);
    const { restore, restoring, purchase, purchasing } = usePurchase();
    // 使用 Zustand store 的积分（全局状态，自动更新）
    const credits = useCreditsStore((state) => state.credits);
    const refreshCreditsStore = useCreditsStore((state) => state.refreshCredits);
    // 使用 CreditContext 的 Modal 控制
    const { showCreditModal, hideCreditModal } = useCredit();
    // 本地也使用 useCredits 用于显示（备用）
    const { credits: localCredits, refresh: refreshCreditsLocal } = useCredits();
    const { createPaymentFromRevenueCat } = useCreatePayment();
    const { payments, loading: paymentsLoading, refresh: refreshPayments } = usePayments(); // 从 Supabase 加载
    const { user } = useAuth();
    
    // 优先使用 store 的积分，如果没有则使用本地积分
    const currentCredits = credits || localCredits;

    useEffect(() => {
        loadCreditPackages();
    }, []);

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

    const loadCreditPackages = async () => {
        try {
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


    // 购买积分包
    const handlePurchaseCredits = async (creditPackage: CreditPackage) => {

        try {
            // 追踪购买开始
            await analytics.credits('purchase_started', {
                product_id: creditPackage.package.product.identifier,
                product_type: 'credits',
                credits: creditPackage.credits,
                price: creditPackage.package.product.price,
                currency: creditPackage.package.product.currencyCode || 'USD',
                discount: creditPackage.discount || null,
            });

            // 记录购买前的积分余额
            const creditsBefore = currentCredits?.available_credits || 0;

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
            // 优先刷新 Zustand store 的积分（全局状态），这样所有页面都会自动更新
            if (user?.id) {
              await refreshCreditsStore(user.id); // 刷新全局积分状态（Zustand store）
            }
            await refreshCreditsLocal(); // 也刷新本地积分（备用）
            await refreshPayments(); // 刷新购买记录

            // 等待一小段时间让数据更新
            await new Promise(resolve => setTimeout(resolve, 500));

            // 获取更新后的积分余额
            const expectedCreditsAfter = creditsBefore + creditPackage.credits;

            // 根据验证结果显示消息
            if (purchaseValidation.success && syncValidation.success) {

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
                });
                return;
            }

            // 追踪购买失败
            await analytics.track('purchase_failed', {
                product_id: creditPackage.package.product.identifier,
                product_type: 'credits',
                credits: creditPackage.credits,
                error: error?.message || 'Unknown error',
            });

            Alert.alert('Purchase Failed', 'Unable to complete your purchase. Please try again.');
        }


    };


    return (

        <View className="px-6 mb-6">
            <View className="flex-row items-center justify-between my-2">
                <Text className="text-xl font-bold text-gray-900">Get More Credits</Text>

                <View className="flex-row items-center justify-center bg-gray-100 rounded-full px-2 py-1">
                    <MaterialCommunityIcons name="star-outline" size={22} color="#FFA500" />
                    <Text className="text-base text-black mx-1">{credits?.available_credits || 0}</Text>
                </View>
            </View>

            {/* Credit Packages */}
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

                        <View className="rounded-lg py-2 bg-orange-500">
                            <Text className="text-white text-center font-semibold">
                                {creditPkg.package.product.priceString}
                            </Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>

        </View>
    );
}
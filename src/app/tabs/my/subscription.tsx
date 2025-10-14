import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSubscription, usePurchase, useManageSubscription } from '@/hooks/useRevenueCat';
import Paywall from '@/components/Paywall';

export default function SubscriptionScreen() {
  const { isActive, isPro, expirationDate, willRenew, productIdentifier, loading } = useSubscription();
  const { restore, restoring } = usePurchase();
  const { showManageSubscriptions } = useManageSubscription();
  const [showPaywall, setShowPaywall] = useState(false);

  const handleRestore = async () => {
    try {
      await restore();
      Alert.alert('成功', '已恢复购买');
    } catch (error) {
      Alert.alert('失败', '无法恢复购买，请稍后重试');
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
    <ScrollView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-6 pt-12 pb-6 bg-black">
        <TouchableOpacity
          onPress={() => router.back()}
          className="mb-4"
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-3xl font-bold">订阅管理</Text>
      </View>

      {/* Subscription Status */}
      <View className="px-6 py-6">
        {isActive ? (
          <View className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-2xl border-2 border-purple-200">
            <View className="flex-row items-center mb-4">
              <View className="w-12 h-12 rounded-full bg-purple-600 items-center justify-center mr-4">
                <MaterialCommunityIcons name="crown" size={24} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-xl font-bold text-gray-900">Pro 会员</Text>
                <Text className="text-purple-600 font-semibold">当前激活</Text>
              </View>
            </View>

            <View className="bg-white/50 rounded-xl p-4 mb-4">
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-600">订阅计划</Text>
                <Text className="font-semibold text-gray-900">{productIdentifier}</Text>
              </View>
              {expirationDate && (
                <View className="flex-row justify-between">
                  <Text className="text-gray-600">{willRenew ? '下次续订' : '到期时间'}</Text>
                  <Text className="font-semibold text-gray-900">
                    {new Date(expirationDate).toLocaleDateString('zh-CN')}
                  </Text>
                </View>
              )}
            </View>

            {/* Premium Features */}
            <View className="mb-4">
              <Text className="font-bold text-gray-900 mb-3">Pro 特权</Text>
              <FeatureItem icon="check-circle" text="无限 AI 造型建议" />
              <FeatureItem icon="check-circle" text="高级穿搭推荐" />
              <FeatureItem icon="check-circle" text="个人风格档案" />
              <FeatureItem icon="check-circle" text="无限保存搭配" />
              <FeatureItem icon="check-circle" text="优先客户支持" />
            </View>

            <TouchableOpacity
              onPress={showManageSubscriptions}
              className="bg-purple-600 rounded-full py-4"
            >
              <Text className="text-white text-center font-bold">管理订阅</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="bg-gray-50 p-6 rounded-2xl border-2 border-gray-200">
            <View className="items-center mb-6">
              <View className="w-16 h-16 rounded-full bg-gray-200 items-center justify-center mb-4">
                <MaterialCommunityIcons name="crown-outline" size={32} color="#9ca3af" />
              </View>
              <Text className="text-xl font-bold text-gray-900 mb-2">免费版本</Text>
              <Text className="text-gray-600 text-center">
                升级到 Pro 解锁所有高级功能
              </Text>
            </View>

            {/* Features Preview */}
            <View className="mb-6">
              <Text className="font-bold text-gray-900 mb-3">Pro 特权包括</Text>
              <FeatureItem icon="star" text="无限 AI 造型建议" locked />
              <FeatureItem icon="star" text="高级穿搭推荐" locked />
              <FeatureItem icon="star" text="个人风格档案" locked />
              <FeatureItem icon="star" text="无限保存搭配" locked />
            </View>

            <TouchableOpacity
              onPress={() => setShowPaywall(true)}
              className="bg-black rounded-full py-4 mb-3"
            >
              <Text className="text-white text-center font-bold text-lg">
                升级到 Pro 🌟
              </Text>
            </TouchableOpacity>

            <Text className="text-center text-gray-500 text-xs">
              7 天无理由退款保证
            </Text>
          </View>
        )}

        {/* Restore Purchases */}
        <TouchableOpacity
          onPress={handleRestore}
          disabled={restoring}
          className="mt-6 py-4 border border-gray-300 rounded-full"
        >
          {restoring ? (
            <ActivityIndicator color="#666" />
          ) : (
            <Text className="text-center text-gray-700 font-semibold">
              恢复购买
            </Text>
          )}
        </TouchableOpacity>

        {/* FAQ */}
        <View className="mt-8">
          <Text className="font-bold text-lg mb-4">常见问题</Text>

          <FAQItem 
            question="如何取消订阅？"
            answer="在 iPhone 的设置 → [您的姓名] → 订阅中管理，或点击上方【管理订阅】按钮"
          />
          <FAQItem 
            question="可以退款吗？"
            answer="我们提供 7 天无理由退款。请联系客服处理。"
          />
          <FAQItem 
            question="订阅会自动续费吗？"
            answer="是的，订阅会自动续费。您可以随时在设置中取消。"
          />
        </View>
      </View>

      {/* Paywall Modal */}
      {showPaywall && (
        <View className="absolute inset-0 bg-white">
          <Paywall
            onClose={() => setShowPaywall(false)}
            onPurchaseSuccess={() => {
              setShowPaywall(false);
              Alert.alert('欢迎加入 Pro！', '感谢您的支持！🎉');
            }}
          />
        </View>
      )}
    </ScrollView>
  );
}

function FeatureItem({ icon, text, locked = false }: { icon: string; text: string; locked?: boolean }) {
  return (
    <View className="flex-row items-center mb-3">
      <MaterialCommunityIcons
        name={icon as any}
        size={20}
        color={locked ? '#9ca3af' : '#10b981'}
      />
      <Text className={`ml-3 flex-1 ${locked ? 'text-gray-500' : 'text-gray-900'}`}>
        {text}
      </Text>
      {locked && (
        <MaterialCommunityIcons name="lock" size={16} color="#9ca3af" />
      )}
    </View>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <TouchableOpacity
      onPress={() => setExpanded(!expanded)}
      className="mb-4 bg-gray-50 rounded-xl p-4"
    >
      <View className="flex-row justify-between items-center">
        <Text className="font-semibold text-gray-900 flex-1 pr-2">{question}</Text>
        <MaterialCommunityIcons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={24}
          color="#666"
        />
      </View>
      {expanded && (
        <Text className="mt-3 text-gray-600 leading-6">{answer}</Text>
      )}
    </TouchableOpacity>
  );
}


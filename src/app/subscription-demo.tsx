/**
 * 订阅功能演示页面
 * 可以从任何地方导航到这个页面来测试订阅功能
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSubscription } from '@/hooks/useRevenueCat';
import Paywall from '@/components/Paywall';

export default function SubscriptionDemoScreen() {
  const [showPaywall, setShowPaywall] = useState(false);
  const { isPro, isActive, loading } = useSubscription();

  return (
    <ScrollView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-6 pt-16 pb-8 bg-gradient-to-br from-purple-600 to-blue-600">
        <TouchableOpacity
          onPress={() => router.back()}
          className="mb-6"
        >
          <MaterialCommunityIcons name="close" size={28} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-4xl font-bold mb-2">
          升级到 Pro
        </Text>
        <Text className="text-white/90 text-lg">
          解锁所有高级功能
        </Text>
      </View>

      {/* Current Status */}
      <View className="px-6 py-6 bg-gray-50 border-b border-gray-200">
        <View className="flex-row items-center">
          <View className={`w-12 h-12 rounded-full ${isPro ? 'bg-green-500' : 'bg-gray-400'} items-center justify-center mr-4`}>
            <MaterialCommunityIcons 
              name={isPro ? 'crown' : 'crown-outline'} 
              size={24} 
              color="white" 
            />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-bold text-gray-900">
              {isPro ? 'Pro 会员' : '免费版本'}
            </Text>
            <Text className="text-gray-600">
              {isPro ? '享受所有高级功能' : '升级解锁更多功能'}
            </Text>
          </View>
        </View>
      </View>

      {/* Features List */}
      <View className="px-6 py-8">
        <Text className="text-2xl font-bold text-gray-900 mb-6">
          Pro 特权
        </Text>

        <FeatureCard
          icon="sparkles"
          title="无限 AI 造型建议"
          description="获得无限次专业 AI 造型师的个性化穿搭建议"
          isPro={isPro}
        />

        <FeatureCard
          icon="tshirt-crew"
          title="高级穿搭推荐"
          description="基于你的风格偏好和衣橱，智能推荐完美搭配"
          isPro={isPro}
        />

        <FeatureCard
          icon="account-star"
          title="个人风格档案"
          description="建立完整的个人风格档案，让 AI 更懂你"
          isPro={isPro}
        />

        <FeatureCard
          icon="heart-multiple"
          title="无限保存搭配"
          description="保存喜欢的搭配，随时查看和分享"
          isPro={isPro}
        />

        <FeatureCard
          icon="flash"
          title="优先体验新功能"
          description="抢先体验最新功能和 AI 模型更新"
          isPro={isPro}
        />

        <FeatureCard
          icon="headset"
          title="专属客户支持"
          description="享受优先客户服务，快速响应你的问题"
          isPro={isPro}
        />
      </View>

      {/* CTA Button */}
      {!isPro && (
        <View className="px-6 pb-8">
          <TouchableOpacity
            onPress={() => setShowPaywall(true)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl py-5 shadow-lg"
          >
            <Text className="text-white text-center text-xl font-bold">
              立即升级 🚀
            </Text>
          </TouchableOpacity>

          <Text className="text-center text-gray-500 text-sm mt-4">
            7 天无理由退款 · 随时取消订阅
          </Text>
        </View>
      )}

      {/* Testimonials */}
      <View className="px-6 py-8 bg-gray-50">
        <Text className="text-xl font-bold text-gray-900 mb-4">
          用户评价
        </Text>

        <View className="bg-white rounded-xl p-4 mb-3 shadow-sm">
          <View className="flex-row mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <MaterialCommunityIcons
                key={star}
                name="star"
                size={16}
                color="#fbbf24"
              />
            ))}
          </View>
          <Text className="text-gray-700 mb-2">
            "AI 造型师真的很专业！推荐的搭配都很适合我的风格，节省了很多选衣服的时间。"
          </Text>
          <Text className="text-gray-500 text-sm">- 小美, Pro 用户</Text>
        </View>

        <View className="bg-white rounded-xl p-4 mb-3 shadow-sm">
          <View className="flex-row mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <MaterialCommunityIcons
                key={star}
                name="star"
                size={16}
                color="#fbbf24"
              />
            ))}
          </View>
          <Text className="text-gray-700 mb-2">
            "物超所值！比请私人造型师便宜太多了，而且随时随地都能用。"
          </Text>
          <Text className="text-gray-500 text-sm">- 李明, Pro 用户</Text>
        </View>
      </View>

      {/* Paywall Modal */}
      {showPaywall && (
        <View className="absolute inset-0 bg-white">
          <Paywall
            onClose={() => setShowPaywall(false)}
            onPurchaseSuccess={() => {
              setShowPaywall(false);
              Alert.alert(
                '🎉 欢迎加入 Pro！',
                '感谢你的支持！现在你可以享受所有高级功能了。',
                [{ text: '开始使用', onPress: () => router.back() }]
              );
            }}
            title="选择你的计划"
            subtitle="开启你的时尚之旅"
          />
        </View>
      )}
    </ScrollView>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  isPro,
}: {
  icon: string;
  title: string;
  description: string;
  isPro: boolean;
}) {
  return (
    <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-gray-100">
      <View className="flex-row items-start">
        <View className={`w-12 h-12 rounded-full ${isPro ? 'bg-green-100' : 'bg-purple-100'} items-center justify-center mr-4`}>
          <MaterialCommunityIcons
            name={icon as any}
            size={24}
            color={isPro ? '#10b981' : '#9333ea'}
          />
        </View>
        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-lg font-bold text-gray-900 flex-1">
              {title}
            </Text>
            {isPro ? (
              <View className="bg-green-100 rounded-full px-3 py-1">
                <Text className="text-green-700 text-xs font-bold">已解锁</Text>
              </View>
            ) : (
              <MaterialCommunityIcons name="lock" size={20} color="#9ca3af" />
            )}
          </View>
          <Text className="text-gray-600 leading-6">{description}</Text>
        </View>
      </View>
    </View>
  );
}


/**
 * 全局积分 Modal 使用示例
 * 
 * 这个文件展示了如何在不同场景下使用全局积分 Modal
 */

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCredit } from '@/contexts/CreditContext';
import { showGlobalCreditModal } from '@/contexts/CreditContext';

// ============================================
// 示例 1: 简单按钮调用
// ============================================
export const SimpleCreditButton = () => {
  const { showCreditModal } = useCredit();

  return (
    <TouchableOpacity
      onPress={showCreditModal}
      className="bg-orange-500 px-6 py-3 rounded-xl"
    >
      <Text className="text-white font-bold">查看积分</Text>
    </TouchableOpacity>
  );
};

// ============================================
// 示例 2: 带图标的积分入口
// ============================================
export const CreditIconButton = () => {
  const { showCreditModal } = useCredit();

  return (
    <TouchableOpacity
      onPress={showCreditModal}
      className="flex-row items-center bg-orange-100 px-4 py-2 rounded-full"
    >
      <Ionicons name="sparkles" size={18} color="#f97316" />
      <Text className="text-orange-600 font-semibold ml-2">积分</Text>
    </TouchableOpacity>
  );
};

// ============================================
// 示例 3: 个人中心列表项
// ============================================
export const CreditListItem = () => {
  const { showCreditModal } = useCredit();

  return (
    <TouchableOpacity
      onPress={showCreditModal}
      className="bg-white rounded-xl p-4 mb-3 flex-row items-center justify-between"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      <View className="flex-row items-center">
        <View className="bg-orange-100 rounded-full p-3">
          <Ionicons name="sparkles" size={24} color="#f97316" />
        </View>
        <View className="ml-4">
          <Text className="text-gray-900 font-semibold text-base">我的积分</Text>
          <Text className="text-gray-500 text-sm">查看积分余额和用途</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
    </TouchableOpacity>
  );
};

// ============================================
// 示例 4: 浮动积分按钮
// ============================================
export const FloatingCreditButton = () => {
  const { showCreditModal } = useCredit();

  return (
    <TouchableOpacity
      onPress={showCreditModal}
      className="absolute top-4 right-4 z-10"
    >
      <View
        className="bg-white rounded-full px-4 py-2 flex-row items-center"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 5,
        }}
      >
        <Ionicons name="sparkles" size={18} color="#f97316" />
        <Text className="text-orange-600 font-semibold ml-2">查看积分</Text>
      </View>
    </TouchableOpacity>
  );
};

// ============================================
// 示例 5: 完整的个人中心页面
// ============================================
export const ProfileScreenWithCredits = () => {
  const { showCreditModal } = useCredit();

  const menuItems = [
    {
      icon: 'sparkles',
      title: '我的积分',
      subtitle: '查看积分余额和用途',
      onPress: showCreditModal,
      color: '#f97316',
    },
    {
      icon: 'person-outline',
      title: '个人信息',
      subtitle: '编辑你的个人资料',
      onPress: () => console.log('个人信息'),
      color: '#3b82f6',
    },
    {
      icon: 'settings-outline',
      title: '设置',
      subtitle: '应用设置和偏好',
      onPress: () => console.log('设置'),
      color: '#6b7280',
    },
  ];

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* 顶部区域 */}
      <View className="bg-gradient-to-br from-orange-400 to-orange-600 pt-16 pb-8 px-6">
        <Text className="text-white text-3xl font-bold mb-2">个人中心</Text>
        <Text className="text-white/80 text-base">管理你的账户和积分</Text>
      </View>

      {/* 菜单列表 */}
      <View className="px-4 -mt-4">
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            onPress={item.onPress}
            className="bg-white rounded-xl p-4 mb-3 flex-row items-center justify-between"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <View className="flex-row items-center flex-1">
              <View
                className="rounded-full p-3"
                style={{ backgroundColor: `${item.color}20` }}
              >
                <Ionicons name={item.icon as any} size={24} color={item.color} />
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-gray-900 font-semibold text-base">
                  {item.title}
                </Text>
                <Text className="text-gray-500 text-sm">{item.subtitle}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

// ============================================
// 示例 6: 在非组件函数中使用
// ============================================
export const checkCreditsBeforeAction = () => {
  // 在服务或工具函数中使用全局方法
  showGlobalCreditModal();
};

// ============================================
// 示例 7: 积分卡片（Dashboard 风格）
// ============================================
export const CreditDashboardCard = () => {
  const { showCreditModal } = useCredit();

  return (
    <TouchableOpacity
      onPress={showCreditModal}
      className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-3xl p-6 mb-4"
      style={{
        shadowColor: '#f97316',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
      }}
    >
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center">
          <Ionicons name="sparkles" size={32} color="white" />
          <Text className="text-white text-xl font-bold ml-3">我的积分</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="white" />
      </View>

      <View className="bg-white/20 rounded-xl p-4">
        <Text className="text-white/80 text-sm mb-1">当前可用</Text>
        <View className="flex-row items-baseline">
          <Text className="text-white text-4xl font-bold">--</Text>
          <Text className="text-white/80 text-lg ml-2">积分</Text>
        </View>
        <Text className="text-white/60 text-xs mt-2">
          点击查看详情和购买更多积分
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// ============================================
// 示例 8: 带提示的积分按钮
// ============================================
export const CreditButtonWithBadge = () => {
  const { showCreditModal } = useCredit();
  const hasLowCredits = true; // 示例：积分不足标记

  return (
    <TouchableOpacity
      onPress={showCreditModal}
      className="relative"
    >
      <View className="bg-orange-100 rounded-full px-4 py-2 flex-row items-center">
        <Ionicons name="sparkles" size={18} color="#f97316" />
        <Text className="text-orange-600 font-semibold ml-2">积分</Text>
      </View>
      
      {hasLowCredits && (
        <View className="absolute -top-1 -right-1 bg-red-500 rounded-full w-5 h-5 items-center justify-center">
          <Text className="text-white text-xs font-bold">!</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// ============================================
// 使用建议
// ============================================
/**
 * 1. 在 React 组件中使用 useCredit() hook
 * 2. 在非组件代码中使用 showGlobalCreditModal()
 * 3. 在明显位置添加积分入口（导航栏、个人中心）
 * 4. 在需要消耗积分的功能前提示用户
 * 5. 保持界面简洁，突出积分信息
 */


import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import paymentService from '@/services/PaymentService';
import type { UserCredits } from '@/types/payment';

/**
 * 积分全局状态管理 Store
 * 使用 Zustand + 持久化存储，实现全局积分状态管理
 */

interface CreditsState {
  // 积分数据
  credits: UserCredits | null;
  
  // 加载状态
  creditsLoading: boolean;
  
  // 最后更新时间
  lastUpdated: number | null;
  
  // 用户 ID（用于验证数据是否属于当前用户）
  userId: string | null;
  
  // 加载积分
  loadCredits: (userId: string) => Promise<void>;
  
  // 刷新积分（从服务器获取最新数据）
  refreshCredits: (userId: string) => Promise<void>;
  
  // 更新积分（本地更新，不请求服务器）
  updateCredits: (credits: UserCredits) => void;
  
  // 清除积分（用户登出时调用）
  clearCredits: () => void;
  
  // 检查积分是否足够
  hasEnoughCredits: (required: number) => boolean;
  
  // 获取可用积分数量
  getAvailableCredits: () => number;
}

export const useCreditsStore = create<CreditsState>()(
  persist(
    (set, get) => ({
      credits: null,
      creditsLoading: false,
      lastUpdated: null,
      userId: null,

      // 加载积分（从缓存或服务器）
      loadCredits: async (userId: string) => {
        // 从服务器获取最新数据
        await get().refreshCredits(userId);
      },

      // 刷新积分（从服务器获取最新数据）
      refreshCredits: async (userId: string) => {
        if (!userId) {
          console.warn('⚠️ [CreditsStore] 刷新积分失败：用户ID为空');
          return;
        }

        try {
          set({ creditsLoading: true });

          const data = await paymentService.getUserCredits(userId);

          set({
            credits: data,
            creditsLoading: false,
            lastUpdated: Date.now(),
            userId: userId,
          });
        } catch (error) {
          console.error('❌ [CreditsStore] 刷新积分失败:', error);
          set({ creditsLoading: false });
        }
      },

      // 更新积分（本地更新，用于购买后立即更新UI）
      updateCredits: (credits: UserCredits) => {
        set({
          credits,
          lastUpdated: Date.now(),
        });
      },

      // 清除积分（用户登出时调用）
      clearCredits: () => {
        set({
          credits: null,
          creditsLoading: false,
          lastUpdated: null,
          userId: null,
        });
      },

      // 检查积分是否足够
      hasEnoughCredits: (required: number) => {
        const credits = get().credits;
        const available = credits?.available_credits || 0;
        return available >= required;
      },

      // 获取可用积分数量
      getAvailableCredits: () => {
        return get().credits?.available_credits || 0;
      },
    }),
    {
      name: 'credits-storage', // AsyncStorage 中的 key
      storage: createJSONStorage(() => AsyncStorage),
      // 只持久化必要的字段
      partialize: (state) => ({
        credits: state.credits,
        lastUpdated: state.lastUpdated,
        userId: state.userId,
      }),
    }
  )
);

// 导出便捷方法（用于在非 React 组件中调用）
export const refreshCreditsGlobal = async (userId: string) => {
  await useCreditsStore.getState().refreshCredits(userId);
};

export const updateCreditsGlobal = (credits: UserCredits) => {
  useCreditsStore.getState().updateCredits(credits);
};

export const clearCreditsGlobal = () => {
  useCreditsStore.getState().clearCredits();
};

export const getAvailableCreditsGlobal = () => {
  return useCreditsStore.getState().getAvailableCredits();
};

export const hasEnoughCreditsGlobal = (required: number) => {
  return useCreditsStore.getState().hasEnoughCredits(required);
};


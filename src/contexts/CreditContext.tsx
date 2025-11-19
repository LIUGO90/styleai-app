import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import CreditModal from '@/components/CreditModal';
import { useAuth } from './AuthContext';
import { useCreditsStore } from '@/stores/creditsStore';
import type { UserCredits } from '@/types/payment';

interface CreditContextType {
  showCreditModal: (id: string, action: string, callback?: () => Promise<void>) => void;
  hideCreditModal: () => void;
  isModalVisible: boolean;
  // 积分相关（从 store 获取）
  credits: UserCredits | null;
  creditsLoading: boolean;
  refreshCredits: () => Promise<void>;
}

const CreditContext = createContext<CreditContextType | undefined>(undefined);

interface CreditProviderProps {
  children: ReactNode;
}

export const CreditProvider: React.FC<CreditProviderProps> = ({ children }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { user } = useAuth();
  
  // 从 Zustand store 获取积分状态
  const credits = useCreditsStore((state) => state.credits);
  const creditsLoading = useCreditsStore((state) => state.creditsLoading);
  const refreshCreditsStore = useCreditsStore((state) => state.refreshCredits);
  const loadCreditsStore = useCreditsStore((state) => state.loadCredits);
  const clearCreditsStore = useCreditsStore((state) => state.clearCredits);

  // 刷新积分（封装 store 方法）
  const refreshCredits = useCallback(async () => {
    if (user?.id) {
      await refreshCreditsStore(user.id);
    }
  }, [user?.id, refreshCreditsStore]);

  // 监听用户变化，自动加载积分
  useEffect(() => {
    if (user?.id) {
      loadCreditsStore(user.id);
    } else {
      clearCreditsStore();
    }
  }, [user?.id, loadCreditsStore, clearCreditsStore]);

  const showCreditModal = useCallback(async (id: string, action: string, callback?: () => Promise<void>) => {
    console.log('🔔 显示积分 Modal');
    // 打开 Modal 前先刷新积分，确保显示最新数据
    if (user?.id) {
      await refreshCreditsStore(user.id);
    }
    setIsModalVisible(true);
    if (callback) {
      await callback();
    }
  }, [user?.id, refreshCreditsStore]);

  const hideCreditModal = useCallback(() => {
    console.log('🔕 隐藏积分 Modal');
    setIsModalVisible(false);
    // 关闭 Modal 后刷新积分，确保购买后的积分是最新的
    if (user?.id) {
      refreshCreditsStore(user.id);
    }
  }, [user?.id, refreshCreditsStore]);

  return (
    <CreditContext.Provider value={{ 
      showCreditModal, 
      hideCreditModal, 
      isModalVisible,
      credits,
      creditsLoading,
      refreshCredits,
    }}>
      {children}
      <CreditModal visible={isModalVisible} onClose={hideCreditModal} />
    </CreditContext.Provider>
  );
};

export const useCredit = () => {
  const context = useContext(CreditContext);
  if (!context) {
    throw new Error('useCredit must be used within CreditProvider');
  }
  return context;
};

// 全局方法（用于在非 React 组件中调用）
let globalCreditInstance: CreditContextType | null = null;

export const setGlobalCreditInstance = (instance: CreditContextType) => {
  globalCreditInstance = instance;
};

// export const showGlobalCreditModal = () => {
//   if (!globalCreditInstance) {
//     console.warn('⚠️ CreditContext not initialized. Make sure CreditProvider is mounted.');
//     return;
//   }
//   globalCreditInstance.showCreditModal();
// };

export const hideGlobalCreditModal = () => {
  if (!globalCreditInstance) {
    console.warn('⚠️ CreditContext not initialized. Make sure CreditProvider is mounted.');
    return;
  }
  globalCreditInstance.hideCreditModal();
};


import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import CreditModal from '@/components/CreditModal';
import { supabase } from '@/utils/supabase';
import { useAuth } from './AuthContext';
import paymentService from '@/services/PaymentService';
import type { UserCredits } from '@/types/payment';

interface CreditContextType {
  showCreditModal: (id: string, action: string, callback?: () => Promise<void>) => void;
  hideCreditModal: () => void;
  isModalVisible: boolean;
  // 积分相关
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
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [creditsLoading, setCreditsLoading] = useState(true);
  const { user } = useAuth();

  // 加载积分
  const loadCredits = useCallback(async () => {
    if (!user?.id) {
      setCredits(null);
      setCreditsLoading(false);
      return;
    }

    try {
      setCreditsLoading(true);
      const data = await paymentService.getUserCredits(user.id);
      setCredits(data);
      console.log('✅ [CreditContext] 积分已加载:', data?.available_credits || 0);
    } catch (error) {
      console.error('❌ [CreditContext] 加载积分失败:', error);
    } finally {
      setCreditsLoading(false);
    }
  }, [user?.id]);

  // 刷新积分
  const refreshCredits = useCallback(async () => {
    console.log('🔄 [CreditContext] 刷新积分...');
    await loadCredits();
  }, [loadCredits]);

  // 监听用户变化，自动加载积分
  useEffect(() => {
    if (user?.id) {
      loadCredits();
    } else {
      setCredits(null);
      setCreditsLoading(false);
    }
  }, [user?.id, loadCredits]);

  const showCreditModal = useCallback(async (id: string, action: string, callback?: () => Promise<void>) => {
    console.log('🔔 显示积分 Modal');
    setIsModalVisible(true);
    if (callback) {
      await callback();
    }
  }, []);

  const hideCreditModal = useCallback(() => {
    console.log('🔕 隐藏积分 Modal');
    setIsModalVisible(false);
    // 关闭 Modal 后刷新积分，确保购买后的积分是最新的
    refreshCredits();
  }, [refreshCredits]);

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


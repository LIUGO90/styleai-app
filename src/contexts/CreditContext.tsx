import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import CreditModal from '@/components/CreditModal';

interface CreditContextType {
  showCreditModal: () => void;
  hideCreditModal: () => void;
  isModalVisible: boolean;
}

const CreditContext = createContext<CreditContextType | undefined>(undefined);

interface CreditProviderProps {
  children: ReactNode;
}

export const CreditProvider: React.FC<CreditProviderProps> = ({ children }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const showCreditModal = useCallback(() => {
    console.log('🔔 显示积分 Modal');
    setIsModalVisible(true);
  }, []);

  const hideCreditModal = useCallback(() => {
    console.log('🔕 隐藏积分 Modal');
    setIsModalVisible(false);
  }, []);

  return (
    <CreditContext.Provider value={{ showCreditModal, hideCreditModal, isModalVisible }}>
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

export const showGlobalCreditModal = () => {
  if (!globalCreditInstance) {
    console.warn('⚠️ CreditContext not initialized. Make sure CreditProvider is mounted.');
    return;
  }
  globalCreditInstance.showCreditModal();
};

export const hideGlobalCreditModal = () => {
  if (!globalCreditInstance) {
    console.warn('⚠️ CreditContext not initialized. Make sure CreditProvider is mounted.');
    return;
  }
  globalCreditInstance.hideCreditModal();
};


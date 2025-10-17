/**
 * 支付相关的 React Hook
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import paymentService from '@/services/PaymentService';
import type {
  Payment,
  UserCredits,
  CreditTransaction,
  PaymentStatistics,
  ActiveSubscription,
} from '@/types/payment';

/**
 * 使用支付记录
 */
export function usePayments() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPayments = useCallback(async () => {
    if (!user?.id) {
      setPayments([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await paymentService.getUserPayments(user.id);
      setPayments(data);
    } catch (error) {
      console.error('[usePayments] Error loading payments:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  return {
    payments,
    loading,
    refresh: loadPayments,
  };
}

/**
 * 使用用户积分
 */
export function useCredits() {
  const { user } = useAuth();
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCredits = useCallback(async () => {
    if (!user?.id) {
      setCredits(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await paymentService.getUserCredits(user.id);
      setCredits(data);
    } catch (error) {
      console.error('[useCredits] Error loading credits:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadCredits();
  }, [loadCredits]);

  const useCredits = useCallback(async (
    amount: number,
    relatedEntityType?: string,
    relatedEntityId?: string,
    description?: string
  ): Promise<boolean> => {
    if (!user?.id) return false;

    const success = await paymentService.useCredits(
      user.id,
      amount,
      relatedEntityType,
      relatedEntityId,
      description
    );

    if (success) {
      await loadCredits(); // 刷新积分余额
    }

    return success;
  }, [user?.id, loadCredits]);

  return {
    credits,
    loading,
    refresh: loadCredits,
    useCredits,
  };
}

/**
 * 使用积分交易历史
 */
export function useCreditTransactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTransactions = useCallback(async () => {
    if (!user?.id) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await paymentService.getCreditTransactions(user.id);
      setTransactions(data);
    } catch (error) {
      console.error('[useCreditTransactions] Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  return {
    transactions,
    loading,
    refresh: loadTransactions,
  };
}

/**
 * 使用支付统计
 */
export function usePaymentStatistics() {
  const { user } = useAuth();
  const [statistics, setStatistics] = useState<PaymentStatistics | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStatistics = useCallback(async () => {
    if (!user?.id) {
      setStatistics(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await paymentService.getPaymentStatistics(user.id);
      setStatistics(data);
    } catch (error) {
      console.error('[usePaymentStatistics] Error loading statistics:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  return {
    statistics,
    loading,
    refresh: loadStatistics,
  };
}

/**
 * 使用活跃订阅
 */
export function useActiveSubscriptions() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<ActiveSubscription[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSubscriptions = useCallback(async () => {
    if (!user?.id) {
      setSubscriptions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await paymentService.getActiveSubscriptions(user.id);
      setSubscriptions(data);
    } catch (error) {
      console.error('[useActiveSubscriptions] Error loading subscriptions:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  return {
    subscriptions,
    loading,
    refresh: loadSubscriptions,
  };
}

/**
 * 创建支付记录（在购买完成后调用）
 */
export function useCreatePayment() {
  const { user } = useAuth();
  const [creating, setCreating] = useState(false);

  const createPaymentFromRevenueCat = useCallback(async (
    customerInfo: any,
    purchasePackage: any
  ): Promise<Payment | null> => {
    if (!user?.id) return null;

    try {
      setCreating(true);
      const payment = await paymentService.createPaymentFromRevenueCat(
        user.id,
        customerInfo,
        purchasePackage
      );
      return payment;
    } catch (error) {
      console.error('[useCreatePayment] Error creating payment:', error);
      return null;
    } finally {
      setCreating(false);
    }
  }, [user?.id]);

  return {
    creating,
    createPaymentFromRevenueCat,
  };
}



import { useEffect, useState, useCallback } from 'react';
import { CustomerInfo, PurchasesOffering } from 'react-native-purchases';
import revenueCatService, { SubscriptionStatus } from '../services/RevenueCatService';

/**
 * Hook to access RevenueCat subscription status
 */
export function useSubscription() {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>({
    isActive: false,
    isPro: false,
    isPremium: false,
    expirationDate: null,
    willRenew: false,
    productIdentifier: null,
  });
  const [loading, setLoading] = useState(true);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);

  const refreshStatus = useCallback(async () => {
    try {
      setLoading(true);
      const [status, info] = await Promise.all([
        revenueCatService.getSubscriptionStatus(),
        revenueCatService.getCustomerInfo(),
      ]);
      setSubscriptionStatus(status);
      setCustomerInfo(info);
    } catch (error) {
      console.error('[useSubscription] Failed to refresh status:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  return {
    subscriptionStatus,
    isActive: subscriptionStatus.isActive,
    expirationDate: subscriptionStatus.expirationDate,
    customerInfo,
    loading,
    refresh: refreshStatus,
  };
}

/**
 * Hook to check if user has a specific entitlement
 */
export function useEntitlement(entitlementId: string) {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAccess = useCallback(async () => {
    try {
      setLoading(true);
      const access = await revenueCatService.hasEntitlement(entitlementId);
      setHasAccess(access);
    } catch (error) {
      console.error('[useEntitlement] Failed to check access:', error);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  }, [entitlementId]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  return {
    hasAccess,
    loading,
    refresh: checkAccess,
  };
}

/**
 * Hook to get available offerings
 */
export function useOfferings() {
  const [currentOffering, setCurrentOffering] = useState<PurchasesOffering | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchOfferings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const offering = await revenueCatService.getCurrentOffering();
      setCurrentOffering(offering);
    } catch (err) {
      console.error('[useOfferings] Failed to fetch offerings:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOfferings();
  }, [fetchOfferings]);

  return {
    currentOffering,
    loading,
    error,
    refresh: fetchOfferings,
  };
}

/**
 * Hook to handle purchases
 */
export function usePurchase() {
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const purchase = useCallback(async (packageToPurchase: any) => {
    try {
      setPurchasing(true);
      const result = await revenueCatService.purchasePackage(packageToPurchase);
      return result;
    } catch (error: any) {
      if (!error.userCancelled) {
        console.error('[usePurchase] Purchase failed:', error);
      }
      throw error;
    } finally {
      setPurchasing(false);
    }
  }, []);

  const purchaseProduct = useCallback(async (productId: string) => {
    try {
      setPurchasing(true);
      const result = await revenueCatService.purchaseProduct(productId);
      return result;
    } catch (error: any) {
      if (!error.userCancelled) {
        console.error('[usePurchase] Purchase failed:', error);
      }
      throw error;
    } finally {
      setPurchasing(false);
    }
  }, []);

  const restore = useCallback(async () => {
    try {
      setRestoring(true);
      const customerInfo = await revenueCatService.restorePurchases();
      return customerInfo;
    } catch (error) {
      console.error('[usePurchase] Restore failed:', error);
      throw error;
    } finally {
      setRestoring(false);
    }
  }, []);

  return {
    purchase,
    purchaseProduct,
    restore,
    purchasing,
    restoring,
  };
}

/**
 * Hook to manage subscriptions
 */
export function useManageSubscription() {
  const showManageSubscriptions = useCallback(async () => {
    try {
      await revenueCatService.showManageSubscriptions();
    } catch (error) {
      console.error('[useManageSubscription] Failed to show manage subscriptions:', error);
    }
  }, []);

  return {
    showManageSubscriptions,
  };
}


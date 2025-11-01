import Purchases, {
  CustomerInfo,
  PurchasesOfferings,
  PurchasesPackage,
  LOG_LEVEL,
  PurchasesStoreProduct,
} from 'react-native-purchases';
import { Platform } from 'react-native';
import { REVENUECAT_CONFIG } from '../config/revenuecat';

export interface SubscriptionStatus {
  isActive: boolean;
  isPro: boolean;
  isPremium: boolean;
  expirationDate: string | null;
  willRenew: boolean;
  productIdentifier: string | null;
}

class RevenueCatService {
  private initialized = false;

  /**
   * Initialize RevenueCat SDK
   * Call this early in your app lifecycle (e.g., App.tsx or _layout.tsx)
   */
  async initialize(userId?: string): Promise<void> {
    if (this.initialized) {
      console.log('ℹ️ [RevenueCat] Already initialized');
      return;
    }

    try {
      console.log('🚀 [RevenueCat] Starting initialization...');
      
      const apiKey = Platform.select({
        ios: REVENUECAT_CONFIG.apiKeys.apple,
        default: REVENUECAT_CONFIG.apiKeys.apple,
      });

      console.log(`📦 [RevenueCat] API Key: ${apiKey ? apiKey.substring(0, 8) + '...' : 'undefined'}`);


      // Validate API key format
      if (!apiKey.startsWith('appl_') && !apiKey.startsWith('goog_') && !apiKey.startsWith('test_')) {
        console.warn(`⚠️ [RevenueCat] Invalid API key format (starts with: ${apiKey.substring(0, 5)})`);
        console.warn('💡 Apple keys should start with "appl_", Google keys with "goog_", test keys with "test_"');
        this.initialized = false;
        return;
      }

      // Configure SDK
      console.log('📦 [RevenueCat] Configuring SDK...');
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      
      console.log('📦 [RevenueCat] Calling Purchases.configure...');
      await Purchases.configure({ apiKey });
      console.log('✅ [RevenueCat] Purchases.configure completed');

      // // Set user ID if provided
      // if (userId) {
      //   await this.login(userId);
      // }

      this.initialized = true;
      console.log('✅ [RevenueCat] Initialization successful');

    } catch (error: any) {
      console.error('❌ [RevenueCat] Initialization failed');
      console.error('❌ [RevenueCat] Error message:', error?.message || 'Unknown error');
      console.error('❌ [RevenueCat] Error code:', error?.code || 'No code');
      console.error('❌ [RevenueCat] Error details:', JSON.stringify(error, null, 2));
      console.warn('⚠️ [RevenueCat] App will continue without subscription features');
      // DON'T throw - allow app to continue
      this.initialized = false;
    }
  }

  /**
   * Login user to RevenueCat
   * This allows syncing purchases across devices
   */
  async login(userId: string): Promise<CustomerInfo> {
    try {
      const { customerInfo } = await Purchases.logIn(userId);

      return customerInfo;
    } catch (error) {
      console.error('[RevenueCat] Login failed:', error);
      throw error;
    }
  }

  /**
   * Logout current user
   */
  async logout(): Promise<CustomerInfo> {
    try {
      const customerInfo = await Purchases.logOut();

      return customerInfo;
    } catch (error) {
      console.error('[RevenueCat] Logout failed:', error);
      throw error;
    }
  }

  /**
   * Get current customer info
   */
  async getCustomerInfo(): Promise<CustomerInfo> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      console.log('🔍customerInfo', customerInfo);
      return customerInfo;
    } catch (error) {
      console.error('[RevenueCat] Failed to get customer info:', error);
      throw error;
    }
  }

  /**
   * Get subscription status
   */
  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    // Return default status if not initialized
    if (!this.initialized) {
      console.warn('[RevenueCat] SDK not initialized, returning default subscription status');
      return {
        isActive: false,
        isPro: false,
        isPremium: false,
        expirationDate: null,
        willRenew: false,
        productIdentifier: null,
      };
    }

    try {
      const customerInfo = await this.getCustomerInfo();
      
      // Check entitlements
      const isPro = REVENUECAT_CONFIG.entitlements.PRO in customerInfo.entitlements.active;
      const isPremium = REVENUECAT_CONFIG.entitlements.PREMIUM in customerInfo.entitlements.active;
      
      // Get active subscription info
      const activeSubscriptions = customerInfo.activeSubscriptions;
      const isActive = activeSubscriptions.length > 0;
      
      let expirationDate: string | null = null;
      let willRenew = false;
      let productIdentifier: string | null = null;
      
      if (isActive && activeSubscriptions.length > 0) {
        // Get the first active subscription
        const firstSubscriptionId = activeSubscriptions[0];
        const subscriptionInfo = customerInfo.subscriptionsByProductIdentifier[firstSubscriptionId];
        
        if (subscriptionInfo) {
          expirationDate = subscriptionInfo.expiresDate || null;
          willRenew = subscriptionInfo.willRenew || false;
          productIdentifier = firstSubscriptionId;
        }
      }
      
      // Check if expired (outside grace period)
      let actualIsActive = isActive;
      if (isActive && expirationDate) {
        const now = new Date();
        const expDate = new Date(expirationDate);
        
        // Check grace period (default 16 days)
        let gracePeriodExpiresDate: string | null = null;
        // RevenueCat does not natively provide gracePeriodExpiresDate on entitlements,
        // so we skip that and always apply the default grace period (16 days).
        // If you wish to support a custom implementation, put it here.

        if (gracePeriodExpiresDate) {
          const graceExpDate = new Date(gracePeriodExpiresDate);
          actualIsActive = now <= graceExpDate;
        
        } else {
          // Default grace period: 16 days
          const gracePeriodMs = 16 * 24 * 60 * 60 * 1000;
          actualIsActive = now <= new Date(expDate.getTime() + gracePeriodMs);
        }
      }
      
      return {
        isActive: actualIsActive,
        isPro,
        isPremium,
        expirationDate,
        willRenew,
        productIdentifier,
      };
    } catch (error) {
      console.error('[RevenueCat] Failed to get subscription status:', error);
      return {
        isActive: false,
        isPro: false,
        isPremium: false,
        expirationDate: null,
        willRenew: false,
        productIdentifier: null,
      };
    }
  }

  /**
   * Check if user has a specific entitlement
   */
  async hasEntitlement(entitlementId: string): Promise<boolean> {
    try {
      const customerInfo = await this.getCustomerInfo();
      return entitlementId in customerInfo.entitlements.active;
    } catch (error) {
      console.error('[RevenueCat] Failed to check entitlement:', error);
      return false;
    }
  }

  /**
   * Get available offerings
   */
  async getOfferings(): Promise<PurchasesOfferings> {
    try {
      const offerings = await Purchases.getOfferings();
      return offerings;
    } catch (error) {
      console.error('[RevenueCat] Failed to get offerings:', error);
      throw error;
    }
  }

  /**
   * Get current offering
   */
  async getCurrentOffering() {
    // Return null if not initialized
    if (!this.initialized) {
      console.warn('[RevenueCat] SDK not initialized, returning null offering');
      return null;
    }

    try {
      const offerings = await this.getOfferings();
      return offerings.current;
    } catch (error) {
      console.error('[RevenueCat] Failed to get current offering:', error);
      return null;
    }
  }

  /**
   * Purchase a package
   */
  async purchasePackage(pkg: PurchasesPackage): Promise<{
    customerInfo: CustomerInfo;
    productIdentifier: string;
  }> {
    try {
      const { customerInfo, productIdentifier } = await Purchases.purchasePackage(pkg);

      return { customerInfo, productIdentifier };
    } catch (error: any) {
      if (error.userCancelled) {

      } else {
        console.error('[RevenueCat] Purchase failed:', error);
      }
      throw error;
    }
  }

  /**
   * Purchase a product by identifier
   */
  async purchaseProduct(productId: string): Promise<{
    customerInfo: CustomerInfo;
    productIdentifier: string;
  }> {
    try {
      // Use getProducts to fetch the PurchasesStoreProduct object by its identifier
      const products = await Purchases.getProducts([productId]);
      if (!products || products.length === 0) {
        throw new Error(`Product with id ${productId} not found`);
      }
      const storeProduct = products[0];
      const { customerInfo, productIdentifier } = await Purchases.purchaseStoreProduct(storeProduct);

      return { customerInfo, productIdentifier };
    } catch (error: any) {
      if (error.userCancelled) {

      } else {
        console.error('[RevenueCat] Purchase failed:', error);
      }
      throw error;
    }
  }

  /**
   * Restore purchases
   */
  async restorePurchases(): Promise<CustomerInfo> {
    try {
      const customerInfo = await Purchases.restorePurchases();

      return customerInfo;
    } catch (error) {
      console.error('[RevenueCat] Failed to restore purchases:', error);
      throw error;
    }
  }

  /**
   * Get products by IDs
   */
  async getProducts(productIds: string[]): Promise<PurchasesStoreProduct[]> {
    try {
      const products = await Purchases.getProducts(productIds);
      return products;
    } catch (error) {
      console.error('[RevenueCat] Failed to get products:', error);
      throw error;
    }
  }

  /**
   * Set custom attributes for analytics
   */
  async setAttributes(attributes: Record<string, string | null>): Promise<void> {
    try {
      await Purchases.setAttributes(attributes);
    } catch (error) {
      console.error('[RevenueCat] Failed to set attributes:', error);
    }
  }

  /**
   * Set email for user
   */
  async setEmail(email: string): Promise<void> {
    try {
      await Purchases.setEmail(email);
    } catch (error) {
      console.error('[RevenueCat] Failed to set email:', error);
    }
  }

  /**
   * Set display name for user
   */
  async setDisplayName(displayName: string): Promise<void> {
    try {
      await Purchases.setDisplayName(displayName);
    } catch (error) {
      console.error('[RevenueCat] Failed to set display name:', error);
    }
  }

  /**
   * Show manage subscriptions page (iOS 15+)
   */
  async showManageSubscriptions(): Promise<void> {
    try {
      await Purchases.showManageSubscriptions();
    } catch (error) {
      console.error('[RevenueCat] Failed to show manage subscriptions:', error);
    }
  }

  /**
   * Check if SDK is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// Export singleton instance
export const revenueCatService = new RevenueCatService();
export default revenueCatService;


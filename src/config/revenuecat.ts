/**
 * RevenueCat Configuration
 * 
 * Setup instructions:
 * 1. Create a RevenueCat account at https://app.revenuecat.com
 * 2. Add your iOS app in RevenueCat dashboard
 * 3. Create entitlements (e.g., "pro", "premium")
 * 4. Create offerings and products
 * 5. Replace the API keys below with your actual keys
 */

export const REVENUECAT_CONFIG = {
  // Get these from https://app.revenuecat.com/settings/api-keys
  apiKeys: {
    apple: process.env.EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY || 'test_hkGwSwiUEYTIhNICJqAKjtUMsdg',
  },

  // Entitlement identifiers
  entitlements: {
    PRO: 'pro',
    PREMIUM: 'premium',
  },

  // Product identifiers (must match App Store Connect and RevenueCat Dashboard)
  products: {
    // Auto-renewable subscriptions (使用 StoreKit 文件中的 ID)
    SUBSCRIPTION_MONTHLY: 'SubscriptionMonThly',
    SUBSCRIPTION_QUARTERLY: 'StylaPay2025Quarterly',
    SUBSCRIPTION_YEARLY: 'StylaPay2025Yearly',
    
    // Consumable AI Points
    AI_POINTS_100: 'AIPoints_100',
    AI_POINTS_600: 'AIPoints_600',
    AI_POINTS_1200: 'AIPoints_1200',
    AI_POINTS_2000: 'AIPoints_2000',
    AI_POINTS_3800: 'AIPoints_3800',
    AI_POINTS_10000: 'AIPoints_10000',
  },

  // Offering identifiers
  offerings: {
    DEFAULT: 'default',
    ONBOARDING: 'onboarding',
  },
} as const;

export type Entitlement = typeof REVENUECAT_CONFIG.entitlements[keyof typeof REVENUECAT_CONFIG.entitlements];
export type ProductId = typeof REVENUECAT_CONFIG.products[keyof typeof REVENUECAT_CONFIG.products];
export type OfferingId = typeof REVENUECAT_CONFIG.offerings[keyof typeof REVENUECAT_CONFIG.offerings];


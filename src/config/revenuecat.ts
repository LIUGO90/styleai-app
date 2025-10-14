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
    apple: process.env.EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY || 'appl_your_api_key_here',
    google: process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY || 'goog_your_api_key_here',
  },

  // Entitlement identifiers
  entitlements: {
    PRO: 'pro',
    PREMIUM: 'premium',
  },

  // Product identifiers (must match App Store Connect)
  products: {
    // Monthly subscriptions
    PRO_MONTHLY: 'pro_monthly',
    PRO_YEARLY: 'pro_yearly',

    // One-time purchases
    LIFETIME: 'lifetime_access',
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


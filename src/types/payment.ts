/**
 * 支付相关的 TypeScript 类型定义
 */

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
export type ProductType = 'subscription' | 'credits' | 'one_time';
export type Platform = 'ios' | 'android' | 'web';
export type Store = 'app_store' | 'play_store' | 'stripe';
export type TransactionType = 'purchase' | 'usage' | 'refund' | 'bonus' | 'subscription_monthly';

/**
 * 支付记录
 */
export interface Payment {
  id: string;
  user_id: string;
  
  // RevenueCat 信息
  revenuecat_transaction_id?: string;
  revenuecat_customer_id?: string;
  
  // 产品信息
  product_id: string;
  product_name?: string;
  product_type: ProductType;
  
  // 订阅特定信息
  entitlement_id?: string;
  is_subscription: boolean;
  subscription_period?: string;
  
  // 积分相关
  credits_amount: number;
  
  // 价格信息
  price?: number;
  currency: string;
  price_string?: string;
  
  // 购买状态
  status: PaymentStatus;
  
  // 日期信息
  purchase_date: string;
  expiration_date?: string;
  
  // 订阅状态
  is_active: boolean;
  will_renew: boolean;
  auto_renew_status?: string;
  
  // 平台信息
  platform?: Platform;
  store?: Store;
  
  // 原始数据
  raw_data?: any;
  
  // 元数据
  created_at: string;
  updated_at: string;
}

/**
 * 创建支付记录的参数
 */
export interface CreatePaymentParams {
  user_id: string;
  revenuecat_transaction_id?: string;
  revenuecat_customer_id?: string;
  product_id: string;
  product_name?: string;
  product_type: ProductType;
  entitlement_id?: string;
  is_subscription?: boolean;
  subscription_period?: string;
  credits_amount?: number;
  price?: number;
  currency?: string;
  price_string?: string;
  status?: PaymentStatus;
  purchase_date?: string;
  expiration_date?: string;
  is_active?: boolean;
  will_renew?: boolean;
  auto_renew_status?: string;
  platform?: Platform;
  store?: Store;
  raw_data?: any;
}

/**
 * 用户积分
 */
export interface UserCredits {
  id: string;
  user_id: string;
  total_credits: number;
  used_credits: number;
  available_credits: number;
  subscription_credits_monthly: number;
  subscription_credits_used: number;
  subscription_credits_reset_date?: string;
  total_purchased: number;
  total_earned: number;
  created_at: string;
  updated_at: string;
}

/**
 * 积分交易记录
 */
export interface CreditTransaction {
  id: string;
  user_id: string;
  transaction_type: TransactionType;
  amount: number;
  balance_after: number;
  payment_id?: string;
  related_entity_type?: string;
  related_entity_id?: string;
  description?: string;
  created_at: string;
}

/**
 * 支付统计
 */
export interface PaymentStatistics {
  user_id: string;
  total_payments: number;
  completed_payments: number;
  refunded_payments: number;
  active_subscriptions: number;
  total_spent: number;
  total_credits_purchased: number;
  last_purchase_date?: string;
  first_purchase_date?: string;
}

/**
 * 活跃订阅
 */
export interface ActiveSubscription extends Payment {
  subscription_status: 'lifetime' | 'active' | 'expired';
  days_until_expiration?: number;
}



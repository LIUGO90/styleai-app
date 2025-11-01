/**
 * 支付服务
 * 处理支付记录的创建、查询和更新
 */

import { supabase } from '@/utils/supabase';
import type {
  Payment,
  CreatePaymentParams,
  UserCredits,
  CreditTransaction,
  PaymentStatistics,
  ActiveSubscription,
  TransactionType,
} from '@/types/payment';

class PaymentService {
  /**
   * 创建支付记录
   */
  async createPayment(params: CreatePaymentParams): Promise<Payment | null> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .insert([{
          ...params,
          status: params.status || 'completed',
          is_subscription: params.is_subscription || false,
          credits_amount: params.credits_amount || 0,
          currency: params.currency || 'USD',
          is_active: params.is_active !== undefined ? params.is_active : false,
          will_renew: params.will_renew !== undefined ? params.will_renew : false,
        }])
        .select()
        .single();

      if (error) {
        console.error('[PaymentService] Error creating payment:', error);
        return null;
      }

      console.log('✅ [PaymentService] Payment created:', data.id);
      
      // 如果是积分购买，自动添加积分
      if (params.product_type === 'credits' && params.credits_amount && params.credits_amount > 0) {
        await this.addCreditsFromPayment(params.user_id, params.credits_amount, data.id);
      }
      
      // 如果是订阅购买，设置月度积分
      // if (params.is_subscription && params.product_type === 'subscription') {
      //   await this.setupSubscriptionCredits(params.user_id, data.id);
      // }

      return data;
    } catch (error) {
      console.error('[PaymentService] Exception creating payment:', error);
      return null;
    }
  }

  /**
   * 从 RevenueCat 购买创建支付记录
   */
  async createPaymentFromRevenueCat(
    userId: string,
    customerInfo: any,
    purchasePackage: any
  ): Promise<Payment | null> {
    console.log('🎈 createPaymentFromRevenueCat', customerInfo, purchasePackage);
    try {
      const productId = purchasePackage.product.identifier;
      const isSubscription = purchasePackage.packageType !== 'CUSTOM';
      
      // 提取积分数量
      const creditsAmount = this.extractCreditsFromProductId(productId);
      
      // 获取 entitlement 信息
      const entitlements = customerInfo.entitlements.active;
      const entitlementId = Object.keys(entitlements)[0] || null;
      const entitlement = entitlementId ? entitlements[entitlementId] : null;
      
      // 从 customerInfo 中获取交易 ID
      // 尝试从最新的订阅信息中获取 transaction ID
      let transactionId: string | undefined = undefined;
      if (isSubscription && customerInfo.activeSubscriptions?.length > 0) {
        const subscriptionId = customerInfo.activeSubscriptions[0];
        const subscriptionInfo = customerInfo.subscriptionsByProductIdentifier?.[subscriptionId];
        if (subscriptionInfo?.originalTransactionIdentifier) {
          transactionId = subscriptionInfo.originalTransactionIdentifier;
        }
      }
      
      // 如果没有找到 transaction ID，尝试从 nonSubscriptionTransactions 中获取
      if (!transactionId && customerInfo.nonSubscriptionTransactions) {
        const nonSubTransactions = customerInfo.nonSubscriptionTransactions;
        const productTransactions = Object.values(nonSubTransactions).flat() as any[];
        const relevantTransaction = productTransactions.find((t: any) => 
          t.productIdentifier === productId
        );
        if (relevantTransaction?.transactionIdentifier) {
          transactionId = relevantTransaction.transactionIdentifier;
        }
      }

      const params: CreatePaymentParams = {
        user_id: userId,
        revenuecat_transaction_id: transactionId,
        revenuecat_customer_id: customerInfo.originalAppUserId,
        product_id: productId,
        product_name: purchasePackage.product.title,
        product_type: isSubscription ? 'subscription' : 'credits',
        entitlement_id: entitlementId || undefined,
        is_subscription: isSubscription,
        credits_amount: creditsAmount,
        price: purchasePackage.product.price,
        price_string: purchasePackage.product.priceString,
        currency: purchasePackage.product.currencyCode,
        status: 'completed',
        is_active: isSubscription ? entitlement?.isActive : false,
        will_renew: isSubscription ? entitlement?.willRenew : false,
        expiration_date: entitlement?.expirationDate,
        platform: 'ios', // 可以根据实际平台动态设置
        store: 'app_store',
        raw_data: {
          customerInfo: {
            originalAppUserId: customerInfo.originalAppUserId,
            activeSubscriptions: customerInfo.activeSubscriptions,
          },
          package: {
            identifier: purchasePackage.identifier,
            packageType: purchasePackage.packageType,
          },
        },
      };

      return await this.createPayment(params);
    } catch (error) {
      console.error('[PaymentService] Error creating payment from RevenueCat:', error);
      console.error('[PaymentService] Error details:', error instanceof Error ? error.message : error);
      return null;
    }
  }

  /**
   * 获取用户的支付记录
   */
  async getUserPayments(userId: string, limit = 50): Promise<Payment[]> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', userId)
        .order('purchase_date', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('[PaymentService] Error fetching payments:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[PaymentService] Exception fetching payments:', error);
      return [];
    }
  }

  /**
   * 获取用户的积分余额
   */
  async getUserCredits(userId: string): Promise<UserCredits | null> {
    try {
      // 先尝试获取
      let { data, error } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', userId)
        .single();

      // 如果不存在，初始化
      if (error && error.code === 'PGRST116') {
        await this.initializeUserCredits(userId);
        
        const result = await supabase
          .from('user_credits')
          .select('*')
          .eq('user_id', userId)
          .single();
        
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('[PaymentService] Error fetching user credits:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('[PaymentService] Exception fetching user credits:', error);
      return null;
    }
  }

  /**
   * 初始化用户积分账户
   */
  async initializeUserCredits(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('initialize_user_credits', {
        p_user_id: userId,
      });

      if (error) {
        console.error('[PaymentService] Error initializing user credits:', error);
        return false;
      }

      console.log('✅ [PaymentService] User credits initialized');
      return true;
    } catch (error) {
      console.error('[PaymentService] Exception initializing user credits:', error);
      return false;
    }
  }

  /**
   * 添加积分（从支付）
   */
  async addCreditsFromPayment(
    userId: string,
    amount: number,
    paymentId: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('add_credits', {
        p_user_id: userId,
        p_amount: amount,
        p_transaction_type: 'purchase',
        p_payment_id: paymentId,
        p_description: `Purchased ${amount} credits`,
      });

      if (error) {
        console.error('[PaymentService] Error adding credits:', error);
        return false;
      }

      console.log(`✅ [PaymentService] Added ${amount} credits to user`);
      return true;
    } catch (error) {
      console.error('[PaymentService] Exception adding credits:', error);
      return false;
    }
  }

  /**
   * 使用积分
   */
  async useCredits(
    userId: string,
    amount: number,
    relatedEntityType?: string,
    relatedEntityId?: string,
    description?: string
  ): Promise<boolean> {
    try {
      // 验证 relatedEntityId 是否为有效的 UUID 格式
      const isValidUUID = (uuid: string): boolean => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
      };

      // 如果 relatedEntityId 不是有效的 UUID，则设为 null
      const validRelatedEntityId = relatedEntityId && isValidUUID(relatedEntityId) ? relatedEntityId : null;

      const { data, error } = await supabase.rpc('use_credits', {
        p_user_id: userId,
        p_amount: amount,
        p_related_entity_type: relatedEntityType,
        p_related_entity_id: validRelatedEntityId,
        p_description: description,
      });

      if (error) {
        console.error('[PaymentService] Error using credits:', error);
        return false;
      }

      if (data === false) {
        console.warn('[PaymentService] Insufficient credits');
        return false;
      }

      console.log(`✅ [PaymentService] Used ${amount} credits`);
      return true;
    } catch (error) {
      console.error('[PaymentService] Exception using credits:', error);
      return false;
    }
  }

  /**
   * 获取积分交易历史
   */
  async getCreditTransactions(userId: string, limit = 100): Promise<CreditTransaction[]> {
    try {
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('[PaymentService] Error fetching credit transactions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[PaymentService] Exception fetching credit transactions:', error);
      return [];
    }
  }

  /**
   * 获取用户支付统计
   */
  async getPaymentStatistics(userId: string): Promise<PaymentStatistics | null> {
    try {
      const { data, error } = await supabase
        .from('payment_statistics')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('[PaymentService] Error fetching payment statistics:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('[PaymentService] Exception fetching payment statistics:', error);
      return null;
    }
  }

  /**
   * 获取活跃订阅
   */
  async getActiveSubscriptions(userId: string): Promise<ActiveSubscription[]> {
    try {
      const { data, error } = await supabase
        .from('active_subscriptions')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('[PaymentService] Error fetching active subscriptions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[PaymentService] Exception fetching active subscriptions:', error);
      return [];
    }
  }

  /**
   * 更新支付状态
   */
  async updatePaymentStatus(
    paymentId: string,
    status: string,
    updates?: Partial<Payment>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('payments')
        .update({
          status,
          ...updates,
        })
        .eq('id', paymentId);

      if (error) {
        console.error('[PaymentService] Error updating payment status:', error);
        return false;
      }

      console.log(`✅ [PaymentService] Payment status updated to ${status}`);
      return true;
    } catch (error) {
      console.error('[PaymentService] Exception updating payment status:', error);
      return false;
    }
  }

  /**
   * 从产品ID提取积分数量
   */
  private extractCreditsFromProductId(productId: string): number {
    const match = productId.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

}

// 导出单例
export const paymentService = new PaymentService();
export default paymentService;



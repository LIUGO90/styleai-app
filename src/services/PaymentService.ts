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
      if (params.is_subscription && params.product_type === 'subscription') {
        await this.setupSubscriptionCredits(params.user_id, data.id);
      }

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
    try {
      const productId = purchasePackage.product.identifier;
      const isSubscription = purchasePackage.packageType !== 'CUSTOM';
      
      // 提取积分数量
      const creditsAmount = this.extractCreditsFromProductId(productId);
      
      // 获取 entitlement 信息
      const entitlements = customerInfo.entitlements.active;
      const entitlementId = Object.keys(entitlements)[0];
      const entitlement = entitlements[entitlementId];

      const params: CreatePaymentParams = {
        user_id: userId,
        revenuecat_customer_id: customerInfo.originalAppUserId,
        product_id: productId,
        product_name: purchasePackage.product.title,
        product_type: isSubscription ? 'subscription' : 'credits',
        entitlement_id: entitlementId,
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

  /**
   * 同步 RevenueCat 订阅状态
   */
  async syncRevenueCatSubscription(
    userId: string,
    customerInfo: any
  ): Promise<void> {
    try {
      const entitlements = customerInfo.entitlements.all;
      
      for (const entitlementId in entitlements) {
        const entitlement = entitlements[entitlementId];
        
        // 查找现有的支付记录
        const { data: existingPayment } = await supabase
          .from('payments')
          .select('*')
          .eq('user_id', userId)
          .eq('product_id', entitlement.productIdentifier)
          .eq('is_subscription', true)
          .order('purchase_date', { ascending: false })
          .limit(1)
          .single();

        if (existingPayment) {
          const wasActive = existingPayment.is_active;
          const isNowActive = entitlement.isActive;
          
          // 更新现有记录
          await supabase
            .from('payments')
            .update({
              is_active: entitlement.isActive,
              will_renew: entitlement.willRenew,
              expiration_date: entitlement.expirationDate,
              status: entitlement.isActive ? 'completed' : 'cancelled',
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingPayment.id);

          // 处理订阅状态变化
          await this.handleSubscriptionStatusChange(
            userId,
            existingPayment,
            wasActive,
            isNowActive,
            entitlement
          );
        }
      }

      console.log('✅ [PaymentService] RevenueCat subscription synced');
    } catch (error) {
      console.error('[PaymentService] Error syncing RevenueCat subscription:', error);
    }
  }

  /**
   * 处理订阅状态变化
   */
  private async handleSubscriptionStatusChange(
    userId: string,
    payment: any,
    wasActive: boolean,
    isNowActive: boolean,
    entitlement: any
  ): Promise<void> {
    try {
      // 订阅被取消
      if (wasActive && !isNowActive) {
        console.log('🔄 [PaymentService] Subscription cancelled for user:', userId);
        await this.handleSubscriptionCancellation(userId, payment);
      }
      
      // 订阅被激活（续费）
      if (!wasActive && isNowActive) {
        console.log('🔄 [PaymentService] Subscription reactivated for user:', userId);
        await this.handleSubscriptionReactivation(userId, payment);
      }
      
      // 检查是否需要发放月度积分
      if (isNowActive) {
        await this.checkAndDistributeMonthlyCredits(userId, payment);
      }
    } catch (error) {
      console.error('[PaymentService] Error handling subscription status change:', error);
    }
  }

  /**
   * 处理订阅取消
   */
  private async handleSubscriptionCancellation(
    userId: string,
    payment: any
  ): Promise<void> {
    try {
      // 记录订阅取消交易
      await supabase.rpc('add_credits', {
        p_user_id: userId,
        p_amount: 0, // 不添加积分，只是记录
        p_transaction_type: 'subscription_monthly',
        p_payment_id: payment.id,
        p_description: 'Subscription cancelled'
      });

      // 更新用户积分表中的订阅状态
      await supabase
        .from('user_credits')
        .update({
          subscription_credits_monthly: 0,
          subscription_credits_used: 0,
          subscription_credits_reset_date: null,
        })
        .eq('user_id', userId);

      console.log('✅ [PaymentService] Subscription cancellation handled');
    } catch (error) {
      console.error('[PaymentService] Error handling subscription cancellation:', error);
    }
  }

  /**
   * 处理订阅重新激活
   */
  private async handleSubscriptionReactivation(
    userId: string,
    payment: any
  ): Promise<void> {
    try {
      // 重置月度积分
      await supabase
        .from('user_credits')
        .update({
          subscription_credits_monthly: 1000, // 每月1000积分
          subscription_credits_used: 0,
          subscription_credits_reset_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30天后重置
        })
        .eq('user_id', userId);

      // 立即发放当月积分
      await this.distributeMonthlyCredits(userId, payment);

      console.log('✅ [PaymentService] Subscription reactivation handled');
    } catch (error) {
      console.error('[PaymentService] Error handling subscription reactivation:', error);
    }
  }

  /**
   * 检查并发放月度积分
   */
  private async checkAndDistributeMonthlyCredits(
    userId: string,
    payment: any
  ): Promise<void> {
    try {
      // 获取用户积分信息
      const { data: userCredits } = await supabase
        .from('user_credits')
        .select('subscription_credits_reset_date, subscription_credits_used')
        .eq('user_id', userId)
        .single();

      if (!userCredits) {
        console.warn('[PaymentService] User credits not found for monthly distribution');
        return;
      }

      const now = new Date();
      const resetDate = userCredits.subscription_credits_reset_date 
        ? new Date(userCredits.subscription_credits_reset_date) 
        : null;

      // 如果重置日期为空或已过期，发放新的月度积分
      if (!resetDate || resetDate <= now) {
        await this.distributeMonthlyCredits(userId, payment);
      }
    } catch (error) {
      console.error('[PaymentService] Error checking monthly credits:', error);
    }
  }

  /**
   * 设置订阅积分（首次订阅时）
   */
  private async setupSubscriptionCredits(
    userId: string,
    paymentId: string
  ): Promise<void> {
    try {
      const monthlyCredits = 1000; // 每月1000积分
      
      // 立即发放第一个月的积分
      await supabase.rpc('add_credits', {
        p_user_id: userId,
        p_amount: monthlyCredits,
        p_transaction_type: 'subscription_monthly',
        p_payment_id: paymentId,
        p_description: `Initial subscription credits - ${monthlyCredits} credits`
      });

      // 设置月度积分重置日期（30天后）
      const nextResetDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await supabase
        .from('user_credits')
        .update({
          subscription_credits_monthly: monthlyCredits,
          subscription_credits_used: 0,
          subscription_credits_reset_date: nextResetDate.toISOString(),
        })
        .eq('user_id', userId);

      console.log(`✅ [PaymentService] Setup subscription credits: ${monthlyCredits} credits for user`);
    } catch (error) {
      console.error('[PaymentService] Error setting up subscription credits:', error);
    }
  }

  /**
   * 发放月度积分
   */
  private async distributeMonthlyCredits(
    userId: string,
    payment: any
  ): Promise<void> {
    try {
      const monthlyCredits = 1000; // 每月1000积分
      
      // 添加积分
      await supabase.rpc('add_credits', {
        p_user_id: userId,
        p_amount: monthlyCredits,
        p_transaction_type: 'subscription_monthly',
        p_payment_id: payment.id,
        p_description: `Monthly subscription credits - ${monthlyCredits} credits`
      });

      // 更新下次重置日期
      const nextResetDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await supabase
        .from('user_credits')
        .update({
          subscription_credits_monthly: monthlyCredits,
          subscription_credits_used: 0,
          subscription_credits_reset_date: nextResetDate.toISOString(),
        })
        .eq('user_id', userId);

      console.log(`✅ [PaymentService] Distributed ${monthlyCredits} monthly credits to user`);
    } catch (error) {
      console.error('[PaymentService] Error distributing monthly credits:', error);
    }
  }
}

// 导出单例
export const paymentService = new PaymentService();
export default paymentService;



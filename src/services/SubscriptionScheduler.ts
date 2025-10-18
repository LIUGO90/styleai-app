/**
 * 订阅积分定时任务服务
 * 处理月度积分的自动发放和订阅状态检查
 */

import paymentService from './PaymentService';
import revenueCatService from './RevenueCatService';
import { supabase } from '../utils/supabase';

export class SubscriptionScheduler {
  private static instance: SubscriptionScheduler;
  private intervalId: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): SubscriptionScheduler {
    if (!SubscriptionScheduler.instance) {
      SubscriptionScheduler.instance = new SubscriptionScheduler();
    }
    return SubscriptionScheduler.instance;
  }

  /**
   * 启动定时任务
   * 每天检查一次订阅状态和月度积分发放
   */
  startDailyCheck(): void {
    if (this.intervalId) {
      console.log('🔄 [SubscriptionScheduler] Already running');
      return;
    }

    console.log('🚀 [SubscriptionScheduler] Starting daily subscription check');
    
    // 立即执行一次检查
    this.performDailyCheck();
    
    // 设置每天执行一次（24小时 = 86400000毫秒）
    this.intervalId = setInterval(() => {
      this.performDailyCheck();
    }, 24 * 60 * 60 * 1000);
  }

  /**
   * 停止定时任务
   */
  stopDailyCheck(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('⏹️ [SubscriptionScheduler] Daily check stopped');
    }
  }

  /**
   * 执行每日检查
   */
  private async performDailyCheck(): Promise<void> {
    try {
      console.log('🔍 [SubscriptionScheduler] Starting daily subscription check...');
      
      // 1. 检查所有活跃订阅用户的月度积分
      await this.checkMonthlyCreditsForActiveSubscriptions();
      
      // 2. 检查过期订阅
      await this.checkExpiredSubscriptions();
      
      console.log('✅ [SubscriptionScheduler] Daily check completed');
    } catch (error) {
      console.error('❌ [SubscriptionScheduler] Daily check failed:', error);
    }
  }

  /**
   * 检查活跃订阅用户的月度积分
   */
  private async checkMonthlyCreditsForActiveSubscriptions(): Promise<void> {
    try {
      // 获取所有活跃订阅的用户
      const { data: activeSubscriptions, error } = await supabase
        .from('payments')
        .select(`
          user_id,
          product_id,
          id,
          purchase_date,
          expiration_date
        `)
        .eq('is_subscription', true)
        .eq('is_active', true)
        .eq('status', 'completed');

      if (error) {
        console.error('[SubscriptionScheduler] Error fetching active subscriptions:', error);
        return;
      }

      console.log(`🔍 [SubscriptionScheduler] Found ${activeSubscriptions?.length || 0} active subscriptions`);

      for (const subscription of activeSubscriptions || []) {
        try {
          // 检查是否需要发放月度积分
          await this.checkUserMonthlyCredits(subscription.user_id, subscription);
        } catch (error) {
          console.error(`[SubscriptionScheduler] Error checking credits for user ${subscription.user_id}:`, error);
        }
      }
    } catch (error) {
      console.error('[SubscriptionScheduler] Error checking monthly credits:', error);
    }
  }

  /**
   * 检查单个用户的月度积分
   */
  private async checkUserMonthlyCredits(userId: string, subscription: any): Promise<void> {
    try {
      // 获取用户积分信息
      const { data: userCredits } = await supabase
        .from('user_credits')
        .select('subscription_credits_reset_date')
        .eq('user_id', userId)
        .single();

      if (!userCredits) {
        console.warn(`[SubscriptionScheduler] User credits not found for user ${userId}`);
        return;
      }

      const now = new Date();
      const resetDate = userCredits.subscription_credits_reset_date 
        ? new Date(userCredits.subscription_credits_reset_date) 
        : null;

      // 如果重置日期为空或已过期，发放新的月度积分
      if (!resetDate || resetDate <= now) {
        console.log(`💰 [SubscriptionScheduler] Distributing monthly credits for user ${userId}`);
        
        // 调用 PaymentService 的方法发放积分
        await (paymentService as any).distributeMonthlyCredits(userId, subscription);
      }
    } catch (error) {
      console.error(`[SubscriptionScheduler] Error checking user monthly credits for ${userId}:`, error);
    }
  }

  /**
   * 检查过期订阅
   */
  private async checkExpiredSubscriptions(): Promise<void> {
    try {
      const now = new Date().toISOString();
      
      // 查找已过期但仍标记为活跃的订阅
      const { data: expiredSubscriptions, error } = await supabase
        .from('payments')
        .select('user_id, product_id, id')
        .eq('is_subscription', true)
        .eq('is_active', true)
        .eq('status', 'completed')
        .lt('expiration_date', now);

      if (error) {
        console.error('[SubscriptionScheduler] Error fetching expired subscriptions:', error);
        return;
      }

      console.log(`🔍 [SubscriptionScheduler] Found ${expiredSubscriptions?.length || 0} expired subscriptions`);

      for (const subscription of expiredSubscriptions || []) {
        try {
          // 更新订阅状态为过期
          await supabase
            .from('payments')
            .update({
              is_active: false,
              status: 'expired',
              updated_at: new Date().toISOString(),
            })
            .eq('id', subscription.id);

          // 处理订阅过期
          await (paymentService as any).handleSubscriptionCancellation(subscription.user_id, subscription);
          
          console.log(`⏰ [SubscriptionScheduler] Marked subscription ${subscription.id} as expired`);
        } catch (error) {
          console.error(`[SubscriptionScheduler] Error handling expired subscription ${subscription.id}:`, error);
        }
      }
    } catch (error) {
      console.error('[SubscriptionScheduler] Error checking expired subscriptions:', error);
    }
  }

  /**
   * 手动触发月度积分检查（用于测试）
   */
  async triggerMonthlyCheck(): Promise<void> {
    console.log('🔧 [SubscriptionScheduler] Manual trigger of monthly check');
    await this.performDailyCheck();
  }

  /**
   * 获取定时任务状态
   */
  getStatus(): { isRunning: boolean; nextCheck?: Date } {
    return {
      isRunning: this.intervalId !== null,
      nextCheck: this.intervalId ? new Date(Date.now() + 24 * 60 * 60 * 1000) : undefined
    };
  }
}

// 导出单例
export const subscriptionScheduler = SubscriptionScheduler.getInstance();
export default subscriptionScheduler;

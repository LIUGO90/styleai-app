/**
 * 分析服务
 * 统一的事件追踪服务，确保所有事件自动关联用户ID
 * 
 * 使用说明：
 * 1. 用户登录时，会自动通过 AppInitializationService 设置 Amplitude 用户ID
 * 2. 所有通过此服务追踪的事件都会自动关联到当前用户ID
 * 3. 无需手动传递用户ID，SDK 会自动关联
 */

import * as amplitude from '@amplitude/analytics-react-native';
import { appInitializationService } from './AppInitializationService';

class AnalyticsService {
  private static instance: AnalyticsService;

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * 追踪事件
   * 
   * 所有事件都会自动关联到当前登录用户的ID（如果已登录）
   * 
   * @param eventName 事件名称
   * @param eventProperties 事件属性（可选）
   * @example
   * ```typescript
   * analytics.track('purchase_completed', {
   *   product_id: 'credits_100',
   *   amount: 9.99,
   *   currency: 'USD'
   * });
   * ```
   */
  async track(
    eventName: string,
    eventProperties?: Record<string, any>
  ): Promise<void> {
    try {
      // 检查 Amplitude 是否已初始化
      // 注意：这里不检查用户ID是否设置，因为 Amplitude SDK 会自动处理
      // 如果用户未登录，事件仍会被记录（匿名用户）
      
      await amplitude.track(eventName, eventProperties).promise;
      
      // 开发环境下的日志（可选）
      if (__DEV__) {
        console.log(`📊 [Analytics] Event tracked: ${eventName}`, eventProperties || {});
      }
    } catch (error: any) {
      // 静默失败，不影响应用功能
      if (__DEV__) {
        console.warn(`⚠️ [Analytics] Failed to track event: ${eventName}`, error?.message || error);
      }
    }
  }

  /**
   * 追踪页面浏览
   * 
   * @param pageName 页面名称
   * @param pageProperties 页面属性（可选）
   * @example
   * ```typescript
   * analytics.page('home_screen', {
   *   category: 'main',
   *   title: 'Home'
   * });
   * ```
   */
  async page(
    pageName: string,
    pageProperties?: Record<string, any>
  ): Promise<void> {
    try {
      await amplitude.track(`[Page] ${pageName}`, {
        ...pageProperties,
        page_name: pageName,
      }).promise;
      
      if (__DEV__) {
        console.log(`📄 [Analytics] Page viewed: ${pageName}`, pageProperties || {});
      }
    } catch (error: any) {
      if (__DEV__) {
        console.warn(`⚠️ [Analytics] Failed to track page: ${pageName}`, error?.message || error);
      }
    }
  }
  
  async credits(
    creditsName: string,
    pageProperties?: Record<string, any>
  ): Promise<void> {
    try {
      await amplitude.track(`[credits] ${creditsName}`, {
        ...pageProperties,
        creditsName: creditsName,
      }).promise;
      
      if (__DEV__) {
        console.log(`📄 [Analytics] Page viewed: ${creditsName}`, pageProperties || {});
      }
    } catch (error: any) {
      if (__DEV__) {
        console.warn(`⚠️ [Analytics] Failed to track page: ${creditsName}`, error?.message || error);
      }
    }
  }

  async http(
    http: string,
    pageProperties?: Record<string, any>
  ): Promise<void> {
    try {
      await amplitude.track(`[http] ${http}`, {
        ...pageProperties,
        http: http,
      }).promise;
      
      if (__DEV__) {
        console.log(`📄 [Analytics] Page viewed: ${http}`, pageProperties || {});
      }
    } catch (error: any) {
      if (__DEV__) {
        console.warn(`⚠️ [Analytics] Failed to track page: ${http}`, error?.message || error);
      }
    }
  }


  async image(
    image: string,
    pageProperties?: Record<string, any>
  ): Promise<void> {
    try {
      await amplitude.track(`[image] ${image}`, {
        ...pageProperties,
        image: image,
      }).promise;
      
      if (__DEV__) {
        console.log(`📄 [Analytics] Page viewed: ${image}`, pageProperties || {});
      }
    } catch (error: any) {
      if (__DEV__) {
        console.warn(`⚠️ [Analytics] Failed to track page: ${image}`, error?.message || error);
      }
    }
  }

  async chat(
    chat: string,
    pageProperties?: Record<string, any>
  ): Promise<void> {
    try {
      await amplitude.track(`[chat] ${chat}`, {
        ...pageProperties,
        chat: chat,
      }).promise;
      
      if (__DEV__) {
        console.log(`📄 [Analytics] Page viewed: ${chat}`, pageProperties || {});
      }
    } catch (error: any) {
      if (__DEV__) {
        console.warn(`⚠️ [Analytics] Failed to track page: ${chat}`, error?.message || error);
      }
    }
  }

  /**
   * 设置用户属性
   * 
   * 注意：这不会覆盖登录时设置的基本用户属性（name, email, role）
   * 
   * @param userProperties 用户属性
   * @example
   * ```typescript
   * analytics.setUserProperties({
   *   subscription_status: 'active',
   *   total_credits: 1000
   * });
   * ```
   */
  async setUserProperties(userProperties: Record<string, any>): Promise<void> {
    try {
      const identify = new amplitude.Identify();
      Object.keys(userProperties).forEach(key => {
        identify.set(key, userProperties[key]);
      });
      await amplitude.identify(identify).promise;
      
      if (__DEV__) {
        console.log(`👤 [Analytics] User properties updated:`, userProperties);
      }
    } catch (error: any) {
      if (__DEV__) {
        console.warn(`⚠️ [Analytics] Failed to set user properties:`, error?.message || error);
      }
    }
  }

  /**
   * 追踪购买事件
   * 
   * @param productId 产品ID
   * @param price 价格
   * @param currency 货币
   * @param quantity 数量（默认1）
   * @param additionalProperties 额外属性（可选）
   */
  async trackPurchase(
    productId: string,
    price: number,
    currency: string = 'USD',
    quantity: number = 1,
    additionalProperties?: Record<string, any>
  ): Promise<void> {
    await this.track('purchase_completed', {
      product_id: productId,
      price,
      currency,
      quantity,
      ...additionalProperties,
    });
  }

  /**
   * 追踪订阅事件
   * 
   * @param productId 产品ID
   * @param price 价格
   * @param currency 货币
   * @param planType 计划类型（如 'monthly', 'yearly'）
   * @param additionalProperties 额外属性（可选）
   */
  async trackSubscription(
    productId: string,
    price: number,
    currency: string = 'USD',
    planType?: string,
    additionalProperties?: Record<string, any>
  ): Promise<void> {
    await this.track('subscription_completed', {
      product_id: productId,
      price,
      currency,
      plan_type: planType,
      ...additionalProperties,
    });
  }

  /**
   * 追踪积分使用事件
   * 
   * @param feature 功能名称（如 'image_generation', 'chat'）
   * @param creditsUsed 使用的积分数量
   * @param creditsRemaining 剩余积分
   * @param additionalProperties 额外属性（可选）
   */
  async trackCreditUsage(
    feature: string,
    creditsUsed: number,
    creditsRemaining: number,
    additionalProperties?: Record<string, any>
  ): Promise<void> {
    await this.track('credit_used', {
      feature,
      credits_used: creditsUsed,
      credits_remaining: creditsRemaining,
      ...additionalProperties,
    });
  }

  /**
   * 追踪图像生成事件
   * 
   * @param style 风格
   * @param creditsUsed 使用的积分
   * @param success 是否成功
   * @param additionalProperties 额外属性（可选）
   */
  async trackImageGeneration(
    style: string,
    creditsUsed: number,
    success: boolean,
    additionalProperties?: Record<string, any>
  ): Promise<void> {
    await this.track('image_generation', {
      style,
      credits_used: creditsUsed,
      success,
      ...additionalProperties,
    });
  }
}

// 导出单例实例
export const analytics = AnalyticsService.getInstance();

// 为了兼容性，也导出一个默认导出
export default analytics;


/**
 * 购买验证工具函数
 * 用于验证购买、数据库同步和积分添加的成功状态
 */

import type { Payment } from '@/types/payment';
import type { CustomerInfo } from 'react-native-purchases';

/**
 * 购买结果验证结果
 */
export interface PurchaseValidationResult {
  success: boolean;
  phase: 'purchase' | 'sync' | 'credits' | 'complete';
  message: string;
  details?: any;
}

/**
 * 验证 RevenueCat 购买结果
 */
export function validatePurchaseResult(
  result: any
): PurchaseValidationResult {
  // 检查 result 对象
  if (!result) {
    return {
      success: false,
      phase: 'purchase',
      message: 'No purchase result received',
    };
  }

  // 检查 customerInfo
  if (!result.customerInfo) {
    return {
      success: false,
      phase: 'purchase',
      message: 'No customer info in purchase result',
      details: result,
    };
  }

  // 检查是否有活跃的订阅或权益
  const hasActiveSubscriptions = 
    result.customerInfo.activeSubscriptions && 
    result.customerInfo.activeSubscriptions.length > 0;
  
  const hasActiveEntitlements = 
    result.customerInfo.entitlements &&
    result.customerInfo.entitlements.active &&
    Object.keys(result.customerInfo.entitlements.active).length > 0;

  if (!hasActiveSubscriptions && !hasActiveEntitlements) {
    return {
      success: false,
      phase: 'purchase',
      message: 'No active subscriptions or entitlements found',
      details: {
        activeSubscriptions: result.customerInfo.activeSubscriptions,
        activeEntitlements: Object.keys(result.customerInfo.entitlements?.active || {}),
      },
    };
  }

  // 购买成功
  return {
    success: true,
    phase: 'purchase',
    message: 'RevenueCat purchase successful',
    details: {
      userId: result.customerInfo.originalAppUserId,
      activeSubscriptions: result.customerInfo.activeSubscriptions,
      activeEntitlements: Object.keys(result.customerInfo.entitlements.active),
    },
  };
}

/**
 * 验证数据库同步结果
 */
export function validateDatabaseSync(
  payment: Payment | null,
  expectedProductId?: string
): PurchaseValidationResult {
  // 检查 payment 对象
  if (!payment) {
    return {
      success: false,
      phase: 'sync',
      message: 'Database sync failed - no payment record created',
    };
  }

  // 检查 payment ID
  if (!payment.id) {
    return {
      success: false,
      phase: 'sync',
      message: 'Payment record has no ID',
      details: payment,
    };
  }

  // 检查状态
  if (payment.status !== 'completed') {
    return {
      success: false,
      phase: 'sync',
      message: `Payment status is ${payment.status}, expected 'completed'`,
      details: {
        id: payment.id,
        status: payment.status,
        productId: payment.product_id,
      },
    };
  }

  // 检查产品ID（如果提供）
  if (expectedProductId && payment.product_id !== expectedProductId) {
    return {
      success: false,
      phase: 'sync',
      message: 'Product ID mismatch',
      details: {
        expected: expectedProductId,
        actual: payment.product_id,
      },
    };
  }

  // 同步成功
  return {
    success: true,
    phase: 'sync',
    message: 'Database sync successful',
    details: {
      paymentId: payment.id,
      productId: payment.product_id,
      status: payment.status,
      createdAt: payment.created_at,
    },
  };
}

/**
 * 验证积分增加
 */
export function validateCreditsIncrease(
  balanceBefore: number,
  balanceAfter: number,
  expectedIncrease: number
): PurchaseValidationResult {
  const actualIncrease = balanceAfter - balanceBefore;

  if (actualIncrease !== expectedIncrease) {
    return {
      success: false,
      phase: 'credits',
      message: 'Credits increase mismatch',
      details: {
        expected: expectedIncrease,
        actual: actualIncrease,
        before: balanceBefore,
        after: balanceAfter,
      },
    };
  }

  return {
    success: true,
    phase: 'credits',
    message: 'Credits added successfully',
    details: {
      increase: actualIncrease,
      before: balanceBefore,
      after: balanceAfter,
    },
  };
}

/**
 * 综合验证购买流程
 */
export function validateCompletePurchase(
  purchaseResult: any,
  payment: Payment | null,
  creditsValidation?: {
    before: number;
    after: number;
    expected: number;
  }
): {
  overallSuccess: boolean;
  results: PurchaseValidationResult[];
  summary: string;
} {
  const results: PurchaseValidationResult[] = [];

  // 1. 验证购买
  const purchaseValidation = validatePurchaseResult(purchaseResult);
  results.push(purchaseValidation);

  // 2. 验证数据库同步
  const syncValidation = validateDatabaseSync(
    payment,
    purchaseResult?.productIdentifier
  );
  results.push(syncValidation);

  // 3. 验证积分（如果提供）
  if (creditsValidation) {
    const creditsResult = validateCreditsIncrease(
      creditsValidation.before,
      creditsValidation.after,
      creditsValidation.expected
    );
    results.push(creditsResult);
  }

  // 计算总体成功状态
  const allSuccess = results.every(r => r.success);
  const purchaseSuccess = results[0].success;

  // 生成摘要
  let summary = '';
  if (allSuccess) {
    summary = '🎉 All phases completed successfully';
  } else if (purchaseSuccess) {
    const failedPhases = results
      .filter(r => !r.success)
      .map(r => r.phase)
      .join(', ');
    summary = `⚠️ Purchase successful but ${failedPhases} failed`;
  } else {
    summary = '❌ Purchase failed';
  }

  return {
    overallSuccess: allSuccess,
    results,
    summary,
  };
}

/**
 * 检查是否是用户取消错误
 */
export function isUserCancelledError(error: any): boolean {
  return error?.userCancelled === true || 
         error?.code === 'USER_CANCELLED' ||
         error?.message?.toLowerCase().includes('cancelled');
}

/**
 * 检查是否是网络错误
 */
export function isNetworkError(error: any): boolean {
  return error?.code === 'NETWORK_ERROR' ||
         error?.message?.toLowerCase().includes('network') ||
         error?.message?.toLowerCase().includes('connection');
}

/**
 * 格式化验证结果用于日志
 */
export function formatValidationResultForLog(
  result: PurchaseValidationResult
): string {
  const icon = result.success ? '✅' : '❌';
  let log = `${icon} Phase ${result.phase}: ${result.message}`;
  
  if (result.details) {
    log += `\n   Details: ${JSON.stringify(result.details, null, 2)}`;
  }
  
  return log;
}

/**
 * 格式化完整验证结果用于日志
 */
export function formatCompleteValidationForLog(
  validation: ReturnType<typeof validateCompletePurchase>
): string {
  let log = validation.summary + '\n';
  
  validation.results.forEach(result => {
    log += formatValidationResultForLog(result) + '\n';
  });
  
  return log;
}


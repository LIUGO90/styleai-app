import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * 徽章管理工具
 * 用于管理 Tab 上的徽章数字，支持业务关联刷新
 */

export type BadgeType = 'lookbook' | 'closet' | 'my';

const BADGE_KEYS = {
  lookbook: 'lookbook_badge',
  closet: 'closet_badge',
  my: 'my_badge',
};

const REFRESH_FLAG_KEY = 'badge_refresh_flag';

// 事件监听器
type BadgeListener = () => void;
const listeners: Set<BadgeListener> = new Set();

/**
 * 添加徽章刷新监听器
 * @param listener 监听函数
 * @returns 取消监听的函数
 */
export const addBadgeListener = (listener: BadgeListener): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/**
 * 通知所有监听器刷新
 */
const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

/**
 * 触发徽章刷新
 * 从业务逻辑中调用此方法来通知 Tab 更新徽章
 */
export const triggerBadgeRefresh = async (): Promise<void> => {
  try {
    // 设置刷新标志
    await AsyncStorage.setItem(REFRESH_FLAG_KEY, Date.now().toString());
    // 通知所有监听器
    notifyListeners();
  } catch (error) {
    console.error('Failed to trigger badge refresh:', error);
  }
};

/**
 * 设置徽章数字
 * @param type 徽章类型
 * @param count 数字（0 或 undefined 将隐藏徽章）
 * @param autoRefresh 是否自动触发刷新（默认 true）
 */
export const setBadge = async (
  type: BadgeType, 
  count: number | undefined,
  autoRefresh: boolean = true
): Promise<void> => {
  try {
    const key = BADGE_KEYS[type];
    if (count === undefined || count === 0) {
      await AsyncStorage.removeItem(key);
    } else {
      await AsyncStorage.setItem(key, count.toString());
    }
    
    if (autoRefresh) {
      await triggerBadgeRefresh();
    }
  } catch (error) {
    console.error(`Failed to set badge for ${type}:`, error);
  }
};

/**
 * 获取徽章数字
 * @param type 徽章类型
 * @returns 徽章数字或 undefined
 */
export const getBadge = async (type: BadgeType): Promise<number | undefined> => {
  try {
    const key = BADGE_KEYS[type];
    const value = await AsyncStorage.getItem(key);
    return value ? parseInt(value) : undefined;
  } catch (error) {
    console.error(`Failed to get badge for ${type}:`, error);
    return undefined;
  }
};

/**
 * 增加徽章数字
 * @param type 徽章类型
 * @param increment 增加的数量（默认 1）
 */
export const incrementBadge = async (type: BadgeType, increment: number = 1): Promise<void> => {
  try {
    const current = await getBadge(type) || 0;
    await setBadge(type, current + increment);
  } catch (error) {
    console.error(`Failed to increment badge for ${type}:`, error);
  }
};

/**
 * 减少徽章数字
 * @param type 徽章类型
 * @param decrement 减少的数量（默认 1）
 */
export const decrementBadge = async (type: BadgeType, decrement: number = 1): Promise<void> => {
  try {
    const current = await getBadge(type) || 0;
    const newValue = Math.max(0, current - decrement);
    await setBadge(type, newValue === 0 ? undefined : newValue);
  } catch (error) {
    console.error(`Failed to decrement badge for ${type}:`, error);
  }
};

/**
 * 清除徽章数字
 * @param type 徽章类型
 */
export const clearBadge = async (type: BadgeType): Promise<void> => {
  await setBadge(type, undefined);
};

/**
 * 清除所有徽章
 */
export const clearAllBadges = async (): Promise<void> => {
  try {
    await Promise.all([
      clearBadge('lookbook'),
      clearBadge('closet'),
      clearBadge('my'),
    ]);
  } catch (error) {
    console.error('Failed to clear all badges:', error);
  }
};

/**
 * 获取所有徽章数字
 */
export const getAllBadges = async (): Promise<{
  lookbook?: number;
  closet?: number;
  my?: number;
}> => {
  try {
    const [lookbook, closet, my] = await Promise.all([
      getBadge('lookbook'),
      getBadge('closet'),
      getBadge('my'),
    ]);
    return { lookbook, closet, my };
  } catch (error) {
    console.error('Failed to get all badges:', error);
    return {};
  }
};

/**
 * 批量设置徽章
 * @param badges 徽章对象
 */
export const setBadges = async (badges: Partial<{
  lookbook: number | undefined;
  closet: number | undefined;
  my: number | undefined;
}>): Promise<void> => {
  try {
    const promises = Object.entries(badges).map(([type, count]) => 
      setBadge(type as BadgeType, count, false)
    );
    await Promise.all(promises);
    await triggerBadgeRefresh();
  } catch (error) {
    console.error('Failed to set badges:', error);
  }
};


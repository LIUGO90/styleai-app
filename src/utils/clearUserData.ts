import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * 彻底清除所有用户数据的工具函数
 * 用于开发环境测试或用户重置应用
 */
export const clearAllUserData = async (): Promise<void> => {
  try {

    // 1. 获取所有AsyncStorage键
    const allKeys = await AsyncStorage.getAllKeys();

    // 2. 清除所有数据
    if (allKeys.length > 0) {
      await AsyncStorage.multiRemove(allKeys);

    } else {

    }

    // 3. 验证清除结果
    const remainingKeys = await AsyncStorage.getAllKeys();
    if (remainingKeys.length === 0) {

    } else {

    }
  } catch (error) {
    console.error("❌ Error clearing user data:", error);
    throw error;
  }
};

/**
 * 清除特定类型的用户数据
 */
export const clearSpecificData = async (dataTypes: string[]): Promise<void> => {
  try {

    for (const dataType of dataTypes) {
      try {
        await AsyncStorage.removeItem(dataType);

      } catch (error) {

      }
    }


  } catch (error) {
    console.error("❌ Error clearing specific data:", error);
    throw error;
  }
};

/**
 * 获取当前存储的数据概览
 */
export const getDataOverview = async (): Promise<Record<string, any>> => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const dataOverview: Record<string, any> = {};

    for (const key of allKeys) {
      try {
        const value = await AsyncStorage.getItem(key);
        dataOverview[key] = value ? JSON.parse(value) : null;
      } catch (error) {
        dataOverview[key] = "Error reading data";
      }
    }

    return dataOverview;
  } catch (error) {
    console.error("❌ Error getting data overview:", error);
    return {};
  }
};

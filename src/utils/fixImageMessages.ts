import { MessageImage } from "../components/types";
import { getImageDimensions } from "./imageDimensions";

/**
 * 修复图片消息，添加缺失的尺寸信息
 * @param image - 图片消息对象
 * @returns Promise<MessageImage> - 修复后的图片消息
 */
export const fixImageMessage = async (
  image: MessageImage,
): Promise<MessageImage> => {
  // 如果已经有尺寸信息，直接返回
  if (image.width && image.height) {
    return image;
  }

  try {
    // 获取图片的真实尺寸
    const dimensions = await getImageDimensions(image.url);

    return {
      ...image,
      width: dimensions.width,
      height: dimensions.height,
    };
  } catch (error) {
    console.warn("获取图片尺寸失败:", error);
    // 如果获取失败，返回原始图片消息
    return image;
  }
};

/**
 * 批量修复图片消息数组
 * @param images - 图片消息数组
 * @returns Promise<MessageImage[]> - 修复后的图片消息数组
 */
export const fixImageMessages = async (
  images: MessageImage[],
): Promise<MessageImage[]> => {
  try {
    const promises = images.map((image) => fixImageMessage(image));
    return await Promise.all(promises);
  } catch (error) {
    console.error("批量修复图片消息失败:", error);
    return images; // 返回原始数组
  }
};

/**
 * 修复消息中的图片数组
 * @param message - 包含图片的消息对象
 * @returns Promise<Message> - 修复后的消息对象
 */
export const fixMessageImages = async (message: any): Promise<any> => {
  if (!message.images || !Array.isArray(message.images)) {
    return message;
  }

  try {
    const fixedImages = await fixImageMessages(message.images);
    return {
      ...message,
      images: fixedImages,
    };
  } catch (error) {
    console.error("修复消息图片失败:", error);
    return message;
  }
};

/**
 * 批量修复消息数组中的图片
 * @param messages - 消息数组
 * @returns Promise<Message[]> - 修复后的消息数组
 */
export const fixMessagesImages = async (messages: any[]): Promise<any[]> => {
  try {
    const promises = messages.map((message) => fixMessageImages(message));
    return await Promise.all(promises);
  } catch (error) {
    console.error("批量修复消息图片失败:", error);
    return messages;
  }
};

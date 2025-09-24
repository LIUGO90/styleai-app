import { MessageImage } from "../components/types";
import { getImageDimensions } from "./imageDimensions";

/**
 * 创建带有尺寸信息的图片消息
 * @param url - 图片源 (require() 返回值或 URI)
 * @param alt - 图片描述 (可选)
 * @param id - 图片ID (可选，默认自动生成)
 * @returns Promise<MessageImage>
 */
export const createImageMessage = async (
  url: any,
  alt?: string,
  id?: string,
): Promise<MessageImage> => {
  try {
    // 获取图片的真实尺寸
    const dimensions = await getImageDimensions(url);

    return {
      id: id || `img_${Date.now()}_${Math.random()}`,
      url,
      alt,
      width: dimensions.width,
      height: dimensions.height,
    };
  } catch (error) {
    console.warn("获取图片尺寸失败，创建不带尺寸的图片消息:", error);

    // 如果获取尺寸失败，返回不带尺寸信息的图片消息
    return {
      id: id || `img_${Date.now()}_${Math.random()}`,
      url,
      alt,
    };
  }
};

/**
 * 批量创建带有尺寸信息的图片消息
 * @param imageSources - 图片源数组，每个元素包含 url, alt?, id?
 * @returns Promise<MessageImage[]>
 */
export const createMultipleImageMessages = async (
  imageSources: { url: any; alt?: string; id?: string }[],
): Promise<MessageImage[]> => {
  try {
    const promises = imageSources.map(({ url, alt, id }) =>
      createImageMessage(url, alt, id),
    );

    return await Promise.all(promises);
  } catch (error) {
    console.error("批量创建图片消息失败:", error);
    throw error;
  }
};

/**
 * 同步创建图片消息（不获取尺寸）
 * 适用于已知尺寸或不需要尺寸的场景
 * @param url - 图片源
 * @param alt - 图片描述 (可选)
 * @param id - 图片ID (可选)
 * @param width - 图片宽度 (可选)
 * @param height - 图片高度 (可选)
 * @returns MessageImage
 */
export const createImageMessageSync = (
  url: any,
  alt?: string,
  id?: string,
  width?: number,
  height?: number,
): MessageImage => {
  return {
    id: id || `img_${Date.now()}_${Math.random()}`,
    url,
    alt,
    width,
    height,
  };
};

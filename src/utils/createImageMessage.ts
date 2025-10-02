import { MessageImage } from "../components/types";


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

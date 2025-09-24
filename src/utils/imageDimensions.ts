import { Image } from "react-native";
import { Dimensions } from "react-native";

// 图片尺寸接口
export interface ImageDimensions {
  width: number;
  height: number;
  aspectRatio: number;
}

// 图片尺寸获取结果
export interface ImageDimensionsResult {
  dimensions: ImageDimensions | null;
  loading: boolean;
  error: string | null;
}

/**
 * 获取本地图片的真实尺寸
 * @param imageSource - 图片源 (require() 返回的值或 URI)
 * @returns Promise<ImageDimensions>
 */
export const getImageDimensions = async (
  imageSource: any,
): Promise<ImageDimensions> => {
  return new Promise((resolve, reject) => {
    if (typeof imageSource === "number") {
      // 本地图片 (require() 返回的数字) - 直接返回图片对象的尺寸
      console.log("imageSource", imageSource);
      try {
        const image = Image.resolveAssetSource(imageSource);
        if (image && image.width && image.height) {
          resolve({
            width: image.width,
            height: image.height,
            aspectRatio: image.width / image.height,
          });
        } else {
          reject(new Error("无法获取本地图片尺寸"));
        }
      } catch (error) {
        reject(new Error(`获取本地图片尺寸失败: ${error}`));
      }
    } else if (typeof imageSource === "string") {
      // 远程图片 URI
      Image.getSize(
        imageSource,
        (width: number, height: number) => {
          resolve({
            width,
            height,
            aspectRatio: width / height,
          });
        },
        (error: any) => {
          reject(new Error(`获取图片尺寸失败: ${error}`));
        },
      );
    } else if (imageSource && typeof imageSource === "object") {
      // 对象形式的图片源
      if (imageSource.uri) {
        Image.getSize(
          imageSource.uri,
          (width: number, height: number) => {
            resolve({
              width,
              height,
              aspectRatio: width / height,
            });
          },
          (error: any) => {
            reject(new Error(`获取图片尺寸失败: ${error}`));
          },
        );
      } else if (imageSource.width && imageSource.height) {
        // 如果对象直接包含尺寸信息
        resolve({
          width: imageSource.width,
          height: imageSource.height,
          aspectRatio: imageSource.width / imageSource.height,
        });
      } else {
        reject(new Error("无效的图片源格式"));
      }
    } else {
      reject(new Error("不支持的图片源类型"));
    }
  });
};

/**
 * 批量获取图片尺寸
 * @param imageSources - 图片源数组
 * @returns Promise<ImageDimensions[]>
 */
export const getMultipleImageDimensions = async (
  imageSources: any[],
): Promise<ImageDimensions[]> => {
  try {
    const promises = imageSources.map((source) => getImageDimensions(source));
    return await Promise.all(promises);
  } catch (error) {
    throw new Error(`批量获取图片尺寸失败: ${error}`);
  }
};

/**
 * 计算适合屏幕的图片尺寸
 * @param originalDimensions - 原始图片尺寸
 * @param maxWidth - 最大宽度 (默认屏幕宽度的80%)
 * @param maxHeight - 最大高度 (默认300)
 * @returns 计算后的尺寸
 */
export const calculateFitDimensions = (
  originalDimensions: ImageDimensions,
  maxWidth?: number,
  maxHeight?: number,
): ImageDimensions => {
  const screenWidth = Dimensions.get("window").width;
  const defaultMaxWidth = maxWidth || screenWidth * 0.4;
  const defaultMaxHeight = maxHeight || 300;

  const {
    width: originalWidth,
    height: originalHeight,
    aspectRatio,
  } = originalDimensions;

  let calculatedWidth = defaultMaxWidth;
  let calculatedHeight = defaultMaxWidth / aspectRatio;

  // 如果计算出的高度超过最大高度，则按高度缩放
  if (calculatedHeight > defaultMaxHeight) {
    calculatedHeight = defaultMaxHeight;
    calculatedWidth = defaultMaxHeight * aspectRatio;
  }

  return {
    width: Math.round(calculatedWidth),
    height: Math.round(calculatedHeight),
    aspectRatio,
  };
};

/**
 * 预加载图片并获取尺寸
 * @param imageSource - 图片源
 * @returns Promise<ImageDimensions>
 */
export const preloadImageAndGetDimensions = async (
  imageSource: any,
): Promise<ImageDimensions> => {
  try {
    // 预加载图片 (仅对远程图片有效)
    if (typeof imageSource === "string" || (imageSource && imageSource.uri)) {
      await Image.prefetch(
        typeof imageSource === "string" ? imageSource : imageSource.uri,
      );
    }

    // 获取尺寸
    return await getImageDimensions(imageSource);
  } catch (error) {
    throw new Error(`预加载图片并获取尺寸失败: ${error}`);
  }
};

/**
 * 检查图片是否为横图
 * @param dimensions - 图片尺寸
 * @returns boolean
 */
export const isLandscape = (dimensions: ImageDimensions): boolean => {
  return dimensions.width > dimensions.height;
};

/**
 * 检查图片是否为竖图
 * @param dimensions - 图片尺寸
 * @returns boolean
 */
export const isPortrait = (dimensions: ImageDimensions): boolean => {
  return dimensions.height > dimensions.width;
};

/**
 * 检查图片是否为正方形
 * @param dimensions - 图片尺寸
 * @param tolerance - 容差值 (默认0.1)
 * @returns boolean
 */
export const isSquare = (
  dimensions: ImageDimensions,
  tolerance: number = 0.1,
): boolean => {
  const ratio = dimensions.width / dimensions.height;
  return Math.abs(ratio - 1) <= tolerance;
};

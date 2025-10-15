/**
 * 新版本的 addLookBook 服务
 * 使用 Supabase 替代 AsyncStorage
 */

import { UserImageService } from '@/services/UserImageService';
import { incrementBadge } from '@/utils/badgeManager';
import { ImageStyle } from '@/types/userImage.types';

/**
 * 添加 Lookbook 图片到 Supabase
 * @param userId 用户 ID
 * @param selectedStyles 选择的风格
 * @param imagesUrl 图片 URL 数组
 * @param title 标题（可选）
 * @param description 描述（可选）
 * @param metadata 额外的元数据（可选）
 */
export const addImageLook = async (
  userId: string,
  selectedStyles: ImageStyle,
  imagesUrl: string[],
  title?: string,
  description?: string,
  metadata?: Record<string, any>
) => {
  try {
    console.log(`📸 开始保存 ${imagesUrl.length} 张 ${selectedStyles} 风格的图片...`);

    // 批量创建图片记录
    const savedImages = await UserImageService.createImages(
      imagesUrl.map((url, index) => ({
        user_id: userId,
        image_url: url,
        style: selectedStyles,
        title: title || `${selectedStyles} Look ${index + 1}`,
        description: description || `Generated outfit in ${selectedStyles} style`,
        metadata: {
          ...metadata,
          index: index,
          total: imagesUrl.length,
          generated_at: new Date().toISOString(),
        },
      }))
    );

    if (savedImages.length > 0) {
      // 增加 Lookbook 徽章计数
      await incrementBadge('lookbook', savedImages.length);

      console.log(`✅ 成功保存 ${savedImages.length} 张图片到 Lookbook`);
      return savedImages;
    } else {
      console.error('❌ 保存图片失败');
      return [];
    }
  } catch (error) {
    console.error('❌ addImageLook 异常:', error);
    throw error;
  }
};

/**
 * 为 ForYou 功能添加图片
 */
export const addForYouImage = async (
  userId: string,
  style: ImageStyle,
  imageUrl: string,
  sourceImageUrl: string,
  prompt: string
) => {
  try {
    const image = await UserImageService.createImage({
      user_id: userId,
      image_url: imageUrl,
      style: style,
      title: `${style} Outfit`,
      description: `AI-generated ${style} style outfit`,
      metadata: {
        source: 'foryou',
        source_image: sourceImageUrl,
        prompt: prompt,
        generated_at: new Date().toISOString(),
      },
    });

    if (image) {
      await incrementBadge('lookbook', 1);
      console.log('✅ ForYou 图片保存成功');
      return image;
    }

    return null;
  } catch (error) {
    console.error('❌ addForYouImage 异常:', error);
    return null;
  }
};


/**
 * 获取用户的 Lookbook 图片（按风格分组）
 */
export const getLookbooksByStyle = async (userId: string) => {
  try {
    const grouped = await UserImageService.getImagesByStyleGrouped(userId);
    return grouped;
  } catch (error) {
    console.error('❌ getLookbooksByStyle 异常:', error);
    return {};
  }
};

/**
 * 获取最近的 Lookbook 图片
 */
export const getRecentLookbooks = async (userId: string, limit: number = 20) => {
  try {
    const images = await UserImageService.getUserImages(userId, {
      limit: limit,
      orderBy: 'created_at',
      orderDirection: 'desc',
    });
    return images;
  } catch (error) {
    console.error('❌ getRecentLookbooks 异常:', error);
    return [];
  }
};

/**
 * 删除 Lookbook 图片
 */
export const deleteLookbookImage = async (imageId: string) => {
  try {
    const success = await UserImageService.softDeleteImage(imageId);
    if (success) {
      console.log('✅ Lookbook 图片已删除');
    }
    return success;
  } catch (error) {
    console.error('❌ deleteLookbookImage 异常:', error);
    return false;
  }
};


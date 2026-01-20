/**
 * 新版本的 addLookBook 服务
 * 使用 Supabase 替代 AsyncStorage
 */
import { incrementBadge } from "@/utils/badgeManager";
import { UserImageService } from '@/services/UserImageService';
import { ImageStyle } from '@/types/userImage.types';
import { imageUpdateManager } from '@/utils/imageUpdateManager';


export const updateImageLook = async (requestId: string, imageUrl: string) => {
    try {
        const savedImages = await UserImageService.updateImageByRequestId(requestId, imageUrl);
        
        // 如果成功更新了图片，通知 ImageContext 刷新
        if (savedImages && savedImages.length > 0) {
            imageUpdateManager.notifyImageUpdate('lookbook');
        }
        
        return savedImages;
    } catch (error) {
        console.error('❌ updateImageLook 异常:', error);
        throw error;
    }
};
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
    requestId: string,
    selectedStyles: ImageStyle,
    imagesUrl: string[],
    metadata: Record<string, any>,
    title?: string,
    description?: string,
) => {
    try {
        // 批量创建图片记录
        const savedImages = await UserImageService.createImages(
            imagesUrl.map((url, index) => ({
                user_id: userId,
                request_id: requestId,
                image_url: url,
                style: selectedStyles,
                title: title || `${selectedStyles} Look ${index + 1}`,
                description: description || `Generated outfit in ${selectedStyles} style`,
                metadata: {
                    ...metadata,
                    // index: index,
                    // total: imagesUrl.length,
                    // generated_at: new Date().toISOString(),
                },
            }))
        );

        if (savedImages.length > 0) {
            // 增加 Lookbook 徽章计数
            await incrementBadge('lookbook', savedImages.length);

            // 通知图片更新（用于实时刷新页面）
            imageUpdateManager.notifyImageUpdate('lookbook');

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
        return success;
    } catch (error) {
        console.error('❌ deleteLookbookImage 异常:', error);
        return false;
    }
};


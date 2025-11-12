import { supabase } from '@/utils/supabase';
import {
  UserImage,
  CreateUserImageInput,
  UpdateUserImageInput,
  GetUserImagesOptions,
  UserImageStats,
  StyleImageCount,
} from '@/types/userImage.types';

/**
 * 用户图片服务
 * 处理所有与 user_images 表的交互
 */
export class UserImageService {
  private static readonly TABLE_NAME = 'user_images';

  /**
   * 创建新图片记录
   */
  static async createImage(input: CreateUserImageInput): Promise<UserImage | null> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .insert({
          user_id: input.user_id,
          image_url: input.image_url,
          style: input.style,
          title: input.title,
          description: input.description,
          metadata: input.metadata || {},
        })
        .select()
        .single();

      if (error) {
        console.error('❌ 创建图片记录失败:', error);
        throw error;
      }

      console.log('✅ 图片记录创建成功:', data.id);
      return data as UserImage;
    } catch (error) {
      console.error('❌ 创建图片记录异常:', error);
      return null;
    }
  }

  /**
   * 根据 request_id 更新图片 URL 和 metadata
   * 
   * @param requestId - 请求 ID
   * @param imageUrl - 新的图片 URL
   * @param metadata - 要更新的 metadata（可选，会与现有 metadata 合并）
   * @param index - 图片索引（可选）
   * @param total - 图片总数（可选）
   * 
   * @returns 更新后的图片记录数组
   * 
   * 注意：此函数会合并更新 metadata，而不是完全替换
   */
  static async updateImageByRequestId(
    requestId: string, 
    imageUrl: string,
    metadata?: Record<string, any>,
    index?: number,
    total?: number
  ): Promise<UserImage[]> {
    try {
      // 先查询现有记录，合并 metadata，然后更新
      // 使用 maybeSingle() 允许记录不存在的情况
      const { data: existingData, error: fetchError } = await supabase
        .from(this.TABLE_NAME)
        .select('metadata, id')
        .eq('request_id', requestId)
        .maybeSingle();

      // 如果记录不存在，记录警告并返回空数组
      if (fetchError) {
        console.error('❌ 查询现有记录失败:', fetchError);
        // 如果是记录不存在的错误，不抛出异常，直接返回
        if (fetchError.code === 'PGRST116') {
          console.warn(`⚠️ 未找到 request_id 为 ${requestId} 的记录，无法更新`);
          return [];
        }
        throw fetchError;
      }

      // 如果记录不存在（maybeSingle 返回 null）
      if (!existingData) {
        console.warn(`⚠️ 未找到 request_id 为 ${requestId} 的记录，无法更新`);
        return [];
      }

      // 构建新的 metadata，合并现有数据和新数据
      const updatedMetadata: Record<string, any> = {
        // 保留现有的 metadata
        ...(existingData.metadata || {}),
        // 添加或覆盖新的 metadata
        ...(metadata || {state:'success'}),
        // 添加索引和总数（如果提供）
        ...(index !== undefined && { index }),
        ...(total !== undefined && { total }),
        // 更新时间戳
        generated_at: new Date().toISOString(),
      };

      // 更新记录
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .update({ 
          image_url: imageUrl,
          metadata: updatedMetadata,
          updated_at: new Date().toISOString(),
        })
        .eq('request_id', requestId)
        .select();

      if (error) {
        console.error('❌ 更新图片记录失败:', error);
        throw error;
      }

      console.log(`✅ 成功更新图片记录，request_id: ${requestId}`);
      return (data || []) as UserImage[];

    } catch (error) {
      console.error('❌ 更新图片记录异常:', error);
      return [];
    }
  }

  
  /**
   * 批量创建图片记录
   */
  static async createImages(inputs: CreateUserImageInput[]): Promise<UserImage[]> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .insert(inputs.map(input => ({
          user_id: input.user_id,
          request_id: input.request_id,
          image_url: input.image_url,
          style: input.style,
          title: input.title,
          description: input.description,
          metadata: input.metadata || {},
        })))
        .select();

      if (error) {
        console.error('❌ 批量创建图片记录失败:', error);
        throw error;
      }

      console.log('✅ 批量创建成功，共', data.length, '条记录');
      return data as UserImage[];
    } catch (error) {
      console.error('❌ 批量创建图片记录异常:', error);
      return [];
    }
  }

  /**
   * 获取用户的所有图片
   */
  static async getUserImages(
    userId: string,
    options: GetUserImagesOptions = {}
  ): Promise<UserImage[]> {
    try {
      const {
        style,
        limit = 100,
        offset = 0,
        orderBy = 'created_at',
        orderDirection = 'desc',
        includeDeleted = false,
      } = options;

      let query = supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('user_id', userId);


      if (style) {
        query = query.eq('style', style);
      }

      // 是否包含已删除
      if (!includeDeleted) {
        query = query.is('deleted_at', null);
      }

      // 排序和分页
      query = query
        .order(orderBy, { ascending: orderDirection === 'asc' });
      // .range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) {
        console.error('❌ 获取用户图片失败:', error);
        throw error;
      }

      console.log(`✅ 获取用户图片成功: ${data?.length || 0} 条记录`);
      return data as UserImage[];
    } catch (error) {
      console.error('❌ 获取用户图片异常:', error);
      return [];
    }
  }

  /**
   * 根据 ID 获取图片
   */
  static async getImageById(imageId: string): Promise<UserImage | null> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('id', imageId)
        .single();

      if (error) {
        console.error('❌ 获取图片失败:', error);
        return null;
      }

      return data as UserImage;
    } catch (error) {
      console.error('❌ 获取图片异常:', error);
      return null;
    }
  }

  /**
   * 更新图片信息
   */
  static async updateImage(
    imageId: string,
    input: UpdateUserImageInput
  ): Promise<UserImage | null> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .update(input)
        .eq('id', imageId)
        .select()
        .single();

      if (error) {
        console.error('❌ 更新图片失败:', error);
        throw error;
      }

      console.log('✅ 图片更新成功:', imageId);
      return data as UserImage;
    } catch (error) {
      console.error('❌ 更新图片异常:', error);
      return null;
    }
  }

  /**
   * 软删除图片（标记为已删除）
   */
  static async softDeleteImage(imageId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(this.TABLE_NAME)
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', imageId);

      if (error) {
        console.error('❌ 软删除图片失败:', error);
        return false;
      }

      console.log('✅ 图片已标记为删除:', imageId);
      return true;
    } catch (error) {
      console.error('❌ 软删除图片异常:', error);
      return false;
    }
  }

  /**
   * 硬删除图片（永久删除）
   */
  static async hardDeleteImage(imageId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(this.TABLE_NAME)
        .delete()
        .eq('id', imageId);

      if (error) {
        console.error('❌ 硬删除图片失败:', error);
        return false;
      }

      console.log('✅ 图片已永久删除:', imageId);
      return true;
    } catch (error) {
      console.error('❌ 硬删除图片异常:', error);
      return false;
    }
  }

  /**
   * 恢复已删除的图片
   */
  static async restoreImage(imageId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(this.TABLE_NAME)
        .update({ deleted_at: null })
        .eq('id', imageId);

      if (error) {
        console.error('❌ 恢复图片失败:', error);
        return false;
      }

      console.log('✅ 图片已恢复:', imageId);
      return true;
    } catch (error) {
      console.error('❌ 恢复图片异常:', error);
      return false;
    }
  }

  /**
   * 批量删除图片
   */
  static async batchDeleteImages(imageIds: string[]): Promise<number> {
    try {
      const { error, count } = await supabase
        .from(this.TABLE_NAME)
        .update({ deleted_at: new Date().toISOString() })
        .in('id', imageIds);

      if (error) {
        console.error('❌ 批量删除图片失败:', error);
        return 0;
      }

      console.log('✅ 批量删除成功，共', count, '条记录');
      return count || 0;
    } catch (error) {
      console.error('❌ 批量删除图片异常:', error);
      return 0;
    }
  }

  /**
   * 获取用户图片统计
   */
  static async getUserImageStats(userId: string): Promise<UserImageStats | null> {
    try {
      const { data, error } = await supabase
        .rpc('get_user_image_stats', { p_user_id: userId });

      if (error) {
        console.error('❌ 获取统计数据失败:', error);
        return null;
      }

      return data[0] as UserImageStats;
    } catch (error) {
      console.error('❌ 获取统计数据异常:', error);
      return null;
    }
  }

  /**
   * 按风格统计图片数量
   */
  static async getImagesByStyleStats(userId: string): Promise<StyleImageCount[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_user_images_by_style', { p_user_id: userId });

      if (error) {
        console.error('❌ 获取风格统计失败:', error);
        return [];
      }

      return data as StyleImageCount[];
    } catch (error) {
      console.error('❌ 获取风格统计异常:', error);
      return [];
    }
  }

  /**
   * 按风格分组获取图片
   */
  static async getImagesByStyleGrouped(
    userId: string
  ): Promise<Record<string, UserImage[]>> {
    try {
      const images = await this.getUserImages(userId);

      const grouped: Record<string, UserImage[]> = {};

      images.forEach(img => {
        const style = img.style || 'Unknown';
        if (!grouped[style]) {
          grouped[style] = [];
        }
        grouped[style].push(img);
      });

      return grouped;
    } catch (error) {
      console.error('❌ 按风格分组异常:', error);
      return {};
    }
  }
  /**
   * 获取最近的图片
   */
  static async getRecentImages(
    userId: string,
    limit: number = 10
  ): Promise<UserImage[]> {
    return this.getUserImages(userId, {
      limit,
      orderBy: 'created_at',
      orderDirection: 'desc',
    });
  }
}


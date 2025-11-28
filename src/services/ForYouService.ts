import { supabase } from '@/utils/supabase';
import { ForYou } from '@/types/styleTemplate.types';

/**
 * ForYou 服务
 */
export class ForYouService {
  private static readonly TABLE_NAME = 'for_you';

  /**
   * 获取所有 ForYou 数据
   */
  static async getAllActiveForYou(): Promise<ForYou[]> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('state', 1)
        .order('order', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ 获取 ForYou 数据失败:', error);
        return [];
      }

      console.log(`✅ [ForYouService] 获取到 ${data?.length || 0} 个 ForYou 项目`);

      return data as ForYou[];
    } catch (error) {
      console.error('❌ [ForYouService] 获取 ForYou 数据异常:', error);
      return [];
    }
  }

  /**
   * 获取所有 ForYou 数据
   */
  static async getAllForYou(): Promise<ForYou[]> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [ForYouService] 获取 ForYou 数据失败:', error);
        return [];
      }

      console.log(`✅ [ForYouService] 获取到 ${data?.length || 0} 个 ForYou 项目`);
      return data as ForYou[];
    } catch (error) {
      console.error('❌ [ForYouService] 获取 ForYou 数据异常:', error);
      return [];
    }
  }

  /**
   * 根据名称获取 ForYou 数据
   */
  static async getForYouByName(name: string): Promise<ForYou[]> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('name', name)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [ForYouService] 获取 ForYou 数据失败:', error);
        return [];
      }

      return data as ForYou[];
    } catch (error) {
      console.error('❌ [ForYouService] 获取 ForYou 数据异常:', error);
      return [];
    }
  }

  /**
   * 获取所有不同的标题（分组）
   */
  static async getAllTitles(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('name')
        .not('name', 'is', null)
        .order('name');

      if (error) {
        console.error('❌ [ForYouService] 获取标题列表失败:', error);
        return [];
      }

      // 去重
      const uniqueTitles = [...new Set(data.map(item => item.name))].filter(name => name && name.trim());
      return uniqueTitles;
    } catch (error) {
      console.error('❌ [ForYouService] 获取标题列表异常:', error);
      return [];
    }
  }

  /**
   * 创建 ForYou 项目
   */
  static async createForYou(forYou: Partial<ForYou>): Promise<ForYou | null> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .insert([forYou])
        .select()
        .single();

      if (error) {
        console.error('❌ [ForYouService] 创建 ForYou 失败:', error);
        return null;
      }

      console.log('✅ ForYou 创建成功:', data);
      return data as ForYou;
    } catch (error) {
      console.error('❌ [ForYouService] 创建 ForYou 异常:', error);
      return null;
    }
  }

  /**
   * 删除 ForYou 项目
   */
  static async deleteForYou(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(this.TABLE_NAME)
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ [ForYouService] 删除 ForYou 失败:', error);
        return false;
      }

      console.log('✅ ForYou 删除成功');
      return true;
    } catch (error) {
      console.error('❌ [ForYouService] 删除 ForYou 异常:', error);
      return false;
    }
  }

}

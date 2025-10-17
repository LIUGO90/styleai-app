import { supabase } from '@/utils/supabase';
import { ForYou } from '@/types/styleTemplate.types';

/**
 * For You 推荐内容服务
 */
export class ForYouService {
  private static readonly TABLE_NAME = 'for_you';

  /**
   * 获取所有 For You 推荐内容
   */
  static async getAllForYouItems(): Promise<ForYou[]> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('*')
        .order('order', { ascending: false });

      if (error) {
        console.error('❌ 获取 For You 推荐内容失败:', error);
        return [];
      }

      console.log(`✅ 获取到 ${data?.length || 0} 个 For You 推荐内容`);
      return data as ForYou[];
    } catch (error) {
      console.error('❌ 获取 For You 推荐内容异常:', error);
      return [];
    }
  }

  /**
   * 根据 ID 获取单个推荐内容
   */
  static async getForYouById(id: string): Promise<ForYou | null> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('❌ 获取 For You 推荐内容失败:', error);
        return null;
      }

      return data as ForYou;
    } catch (error) {
      console.error('❌ 获取 For You 推荐内容异常:', error);
      return null;
    }
  }

  /**
   * 根据名称获取推荐内容
   */
  static async getForYouByName(name: string): Promise<ForYou[]> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('name', name);

      if (error) {
        console.error('❌ 获取 For You 推荐内容失败:', error);
        return [];
      }

      return data as ForYou[];
    } catch (error) {
      console.error('❌ 获取 For You 推荐内容异常:', error);
      return [];
    }
  }

  /**
   * 创建新的推荐内容
   */
  static async createForYouItem(item: Omit<ForYou, 'id' | 'created_at' | 'updated_at'>): Promise<ForYou | null> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .insert([item])
        .select()
        .single();

      if (error) {
        console.error('❌ 创建 For You 推荐内容失败:', error);
        return null;
      }

      console.log('✅ 创建 For You 推荐内容成功');
      return data as ForYou;
    } catch (error) {
      console.error('❌ 创建 For You 推荐内容异常:', error);
      return null;
    }
  }

  /**
   * 更新推荐内容
   */
  static async updateForYouItem(id: string, updates: Partial<Omit<ForYou, 'id' | 'created_at' | 'updated_at'>>): Promise<ForYou | null> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ 更新 For You 推荐内容失败:', error);
        return null;
      }

      console.log('✅ 更新 For You 推荐内容成功');
      return data as ForYou;
    } catch (error) {
      console.error('❌ 更新 For You 推荐内容异常:', error);
      return null;
    }
  }

  /**
   * 删除推荐内容
   */
  static async deleteForYouItem(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(this.TABLE_NAME)
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ 删除 For You 推荐内容失败:', error);
        return false;
      }

      console.log('✅ 删除 For You 推荐内容成功');
      return true;
    } catch (error) {
      console.error('❌ 删除 For You 推荐内容异常:', error);
      return false;
    }
  }
}


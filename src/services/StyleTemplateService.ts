import { supabase } from '@/utils/supabase';
import { StyleTemplate } from '@/types/styleTemplate.types';

/**
 * 风格模板服务
 */
export class StyleTemplateService {
  private static readonly TABLE_NAME = 'style_templates';

  /**
   * 获取所有风格模板
   */
  static async getAllTemplates(): Promise<StyleTemplate[]> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('*')
        .order('order', { ascending: true });

      if (error) {
        console.error('❌ 获取风格模板失败:', error);
        return [];
      }

      console.log(`✅ 获取到 ${data?.length || 0} 个风格模板`);
      return data as StyleTemplate[];
    } catch (error) {
      console.error('❌ 获取风格模板异常:', error);
      return [];
    }
  }

  /**
   * 根据名称获取模板
   */
  static async getTemplateByName(name: string): Promise<StyleTemplate[] | null> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('name', name);

      if (error) {
        console.error('❌ 获取风格模板失败:', error);
        return null;
      }

      return data as StyleTemplate[];
    } catch (error) {
      console.error('❌ 获取风格模板异常:', error);
      return null;
    }
  }
}


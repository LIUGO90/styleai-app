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
        .eq('state', true)
        .order('order', { ascending: false });

      if (error) {
        console.error('❌ [StyleTemplateService] 获取风格模板失败:', error);
        return [];
      }

      return data as StyleTemplate[];
    } catch (error) {
      console.error('❌ [StyleTemplateService] 获取风格模板异常:', error);
      return [];
    }
  }

  /**
   * 根据名称获取模板
   */
  static async getTemplateByName(name: string): Promise<StyleTemplate[] | null> {
    try {
      console.time(`[StyleTemplateService] getTemplateByName-${name}`);
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('name', name)
        .eq('state', true)
        .order('order', { ascending: false });
      console.timeEnd(`[StyleTemplateService] getTemplateByName-${name}`);

      if (error) {
        console.error('❌ [StyleTemplateService] 获取风格模板失败:', error);
        return null;
      }
      // for (const template of data as StyleTemplate[]) {
      //   console.log(`${template.name} - ${template.order}`);
      // }
      return data as StyleTemplate[];
    } catch (error) {
      console.error('❌ [StyleTemplateService] 获取风格模板异常:', error);
      return null;
    }
  }
}


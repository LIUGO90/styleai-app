import { supabase } from '@/utils/supabase';

/**
 * 资源类型定义
 */
export interface Resource {
  id: string;
  name: string;
  type: string;
  url: string;
  shopurl?: string;
  deleted_at?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * ShopLook 类型定义
 */
export interface ShopLook {
  id: string;
  look_id: string;
  resource_id: string;
  order: number;
  created_at: string;
  // 关联的资源信息
  resource?: Resource;
}

/**
 * ShopLook 服务
 * 用于查询 style_templates 关联的购物资源
 */
export class ShopLookService {
  private static readonly TABLE_NAME = 'shoplook';
  private static readonly RESOURCES_TABLE = 'resources';

  /**
   * 根据 look_id (style_template.id) 获取关联的 ShopLook 列表
   * @param lookId style_templates 表的 id
   * @returns ShopLook 列表，包含关联的资源信息
   */
  static async getShopLookByLookid(lookId: string): Promise<ShopLook[]> {
    try {
      // 查询 shoplook 表，并关联 resources 表
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select(`
          *,
          resource:resources(*)
        `)
        .eq('look_id', lookId)
        .order('order', { ascending: false });

      if (error) {
        console.error('❌ [ShopLookService] 获取 ShopLook 失败:', error);
        return [];
      }

      console.log(`✅ [ShopLookService] 获取到 ${data?.length || 0} 个 ShopLook (look_id: ${lookId})`);
      return data as ShopLook[];
    } catch (error) {
      console.error('❌ [ShopLookService] 获取 ShopLook 异常:', error);
      return [];
    }
  }

  /**
   * 根据多个 look_id 批量获取关联的 ShopLook
   * @param lookIds style_templates 表的 id 数组
   * @returns Map<look_id, ShopLook[]>
   */
  static async getShopLooksByLookIds(lookIds: string[]): Promise<Map<string, ShopLook[]>> {
    console.log(`✅ [ShopLookService] 批量获取 ShopLook 开始，共 ${lookIds} 个 look_id`);
    const result = new Map<string, ShopLook[]>();
    
    if (lookIds.length === 0) {
      return result;
    }

    try {
      console.log(`✅ [ShopLookService] 开始查询 supabase...`);
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select(`
          *
        `)
        .in('look_id', lookIds)
        .order('order', { ascending: false });

      console.log(`✅ [ShopLookService] 查询完成: data=${JSON.stringify(data)}, error=${JSON.stringify(error)}`);
      
      if (error) {
        console.error('❌ [ShopLookService] 批量获取 ShopLook 失败:', error);
        return result;
      }

      // 获取所有 resource_id 并查询资源
      const resourceIds = [...new Set((data || []).map(item => item.resource_id))];
      const resourcesMap = new Map<string, Resource>();
      
      if (resourceIds.length > 0) {
        const { data: resourcesData } = await supabase
          .from(this.RESOURCES_TABLE)
          .select('*')
          .in('id', resourceIds)
          .is('deleted_at', null);
        
        console.log(`✅ [ShopLookService] 资源查询: ${JSON.stringify(resourcesData)}`);
        
        for (const res of (resourcesData || [])) {
          resourcesMap.set(res.id, res as Resource);
        }
      }

      // 按 look_id 分组，并附加 resource 信息
      for (const item of (data || [])) {
        const lookId = item.look_id;
        if (!result.has(lookId)) {
          result.set(lookId, []);
        }
        const shoplook: ShopLook = {
          ...item,
          resource: resourcesMap.get(item.resource_id),
        };
        result.get(lookId)!.push(shoplook);
      }
      console.log(`✅ [ShopLookService] 批量获取 ShopLook 完成，共 ${data?.length || 0} 条记录`, JSON.stringify(data));
      return result;
    } catch (error) {
      console.error('❌ [ShopLookService] 批量获取 ShopLook 异常:', error);
      return result;
    }
  }

  /**
   * 获取单个资源详情
   * @param resourceId 资源 ID
   */
  static async getResourceById(resourceId: string): Promise<Resource | null> {
    try {
      const { data, error } = await supabase
        .from(this.RESOURCES_TABLE)
        .select('*')
        .eq('id', resourceId)
        .is('deleted_at', null)
        .single();

      if (error) {
        console.error('❌ [ShopLookService] 获取资源失败:', error);
        return null;
      }

      return data as Resource;
    } catch (error) {
      console.error('❌ [ShopLookService] 获取资源异常:', error);
      return null;
    }
  }
}


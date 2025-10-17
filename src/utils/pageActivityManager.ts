/**
 * 页面活动状态管理器
 * 用于跟踪用户当前所在的页面，防止在当前页面增加徽章
 */

export type PageType = 'lookbook' | 'closet' | 'my' | null;

class PageActivityManager {
  private activePage: PageType = null;

  /**
   * 设置当前活动页面
   * @param page 页面类型
   */
  setActivePage(page: PageType): void {
    this.activePage = page;
    console.log(`📍 设置活动页面: ${page}`);
  }

  /**
   * 获取当前活动页面
   * @returns 当前活动页面类型
   */
  getActivePage(): PageType {
    return this.activePage;
  }

  /**
   * 检查指定页面是否为当前活动页面
   * @param page 页面类型
   * @returns 是否为活动页面
   */
  isPageActive(page: PageType): boolean {
    return this.activePage === page;
  }

  /**
   * 清除活动页面
   */
  clearActivePage(): void {
    this.activePage = null;
    console.log('📍 清除活动页面');
  }
}

// 导出单例实例
export const pageActivityManager = new PageActivityManager();


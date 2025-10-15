

export interface ForYou {
  id: string;
  name: string;
  url: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * 风格模板类型定义
 */

export interface StyleTemplate {
  id: string;
  name: string;
  urls: string;
  post: string;
  prompt: string;
  order: number;
  created_at: string;
}

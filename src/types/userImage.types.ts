/**
 * 用户图片类型定义
 */

export type ImageStyle = 
  | 'style_an_item'
  | 'outfit_check'
  | 'free_chat'
  | 'Old Money'
  | 'Y2K'
  | 'BurgundyFall'
  | 'Casual'
  | 'Formal'
  | 'Street'
  | 'Minimal'
  | string; // 允许自定义风格

export interface ImageMetadata {
  // AI 生成相关
  prompt?: string;
  model?: string;
  generationTime?: number;
  
  // 图片属性
  width?: number;
  height?: number;
  size?: number;
  format?: string;
  
  // 业务相关
  occasion?: string;
  season?: string;
  tags?: string[];
  aiScore?: number;
  
  // 其他自定义数据
  [key: string]: any;
}

export interface UserImage {
  id: string;
  user_id: string;
  image_url: string;
  style?: ImageStyle;
  title?: string;
  description?: string;
  metadata?: ImageMetadata;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface CreateUserImageInput {
  user_id: string;
  request_id: string;
  image_url: string;
  style?: ImageStyle;
  title?: string;
  description?: string;
  metadata?: ImageMetadata;
}

export interface UpdateUserImageInput {
  title?: string;
  description?: string;
  style?: ImageStyle;
  metadata?: ImageMetadata;
}

export interface UserImageStats {
  total_images: number;
}

export interface StyleImageCount {
  style: string;
  image_count: number;
}

export interface GetUserImagesOptions {
  style?: ImageStyle;
  limit?: number;
  offset?: number;
  orderBy?: 'created_at' | 'updated_at';
  orderDirection?: 'asc' | 'desc';
  includeDeleted?: boolean;
}


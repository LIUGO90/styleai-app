import { create } from 'zustand';

/**
 * Template 生成状态管理
 * 为每个 template 独立跟踪 isGenerating 状态
 */

interface TemplateGenerationState {
  // 存储每个 template ID 的生成状态
  generatingTemplates: Record<string, boolean>;
  
  // 设置某个 template 的生成状态
  setGenerating: (templateId: string, isGenerating: boolean) => void;
  
  // 获取某个 template 的生成状态
  isGenerating: (templateId: string) => boolean;
  
  // 清除所有生成状态（可选，用于重置）
  clearAll: () => void;
  
  // 清除特定 template 的生成状态
  clear: (templateId: string) => void;
}

export const useTemplateGenerationStore = create<TemplateGenerationState>((set, get) => ({
  generatingTemplates: {},
  
  setGenerating: (templateId: string, isGenerating: boolean) => {
    set((state) => ({
      generatingTemplates: {
        ...state.generatingTemplates,
        [templateId]: isGenerating,
      },
    }));
  },
  
  isGenerating: (templateId: string) => {
    return get().generatingTemplates[templateId] || false;
  },
  
  clearAll: () => {
    set({ generatingTemplates: {} });
  },
  
  clear: (templateId: string) => {
    set((state) => {
      const newGeneratingTemplates = { ...state.generatingTemplates };
      delete newGeneratingTemplates[templateId];
      return { generatingTemplates: newGeneratingTemplates };
    });
  },
}));


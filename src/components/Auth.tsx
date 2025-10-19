/**
 * 统一的 Auth 组件导出
 * React Native 会根据平台自动选择：
 * - Web: Auth.web.tsx
 * - iOS/Android: Auth.native.tsx
 */

// 这个文件作为 fallback，如果没有平台特定文件时使用
export { AppleAuth } from './Auth.native';


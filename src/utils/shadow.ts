import { Platform } from 'react-native';

// 通用的阴影样式配置
export const createShadowStyle = (options: {
  shadowColor?: string;
  shadowOffset?: { width: number; height: number };
  shadowOpacity?: number;
  shadowRadius?: number;
  elevation?: number;
}) => {
  const {
    shadowColor = '#000',
    shadowOffset = { width: 0, height: 2 },
    shadowOpacity = 0.25,
    shadowRadius = 4,
    elevation = 5,
  } = options;

  if (Platform.OS === 'web') {
    // Web 环境使用 boxShadow
    const { width, height } = shadowOffset;
    return {
      boxShadow: `${width}px ${height}px ${shadowRadius}px ${shadowColor}${Math.round(shadowOpacity * 255).toString(16).padStart(2, '0')}`,
    };
  } else {
    // 移动端使用原生阴影属性
    return {
      shadowColor,
      shadowOffset,
      shadowOpacity,
      shadowRadius,
      elevation,
    };
  }
};

// 预设的阴影样式
export const shadowStyles = {
  small: createShadowStyle({
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  }),
  medium: createShadowStyle({
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  }),
  large: createShadowStyle({
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  }),
};

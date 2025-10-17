import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onHide: () => void;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export function Toast({
  visible,
  message,
  type = 'success',
  duration = 3000,
  onHide,
  action,
}: ToastProps) {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // 显示动画
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      let timeOut = duration;
      if (type === 'info') {
        timeOut = 2000;
      }
      // 自动隐藏
      const timer = setTimeout(() => {
        hideToast();
      }, timeOut);

      return () => clearTimeout(timer);
    } else {
      hideToast();
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'check-circle';
      case 'error':
        return 'alert-circle';
      case 'warning':
        return 'alert';
      case 'info':
        return 'information';
      default:
        return 'check-circle';
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success':
        return { bg: '#10b981', icon: '#ffffff' };
      case 'error':
        return { bg: '#ef4444', icon: '#ffffff' };
      case 'warning':
        return { bg: '#f59e0b', icon: '#ffffff' };
      case 'info':
        return { bg: '#3b82f6', icon: '#ffffff' };
      default:
        return { bg: '#10b981', icon: '#ffffff' };
    }
  };

  const colors = getColors();

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <View style={[styles.toast, { backgroundColor: colors.bg }]}>
        <View style={styles.content}>
          <MaterialCommunityIcons
            name={getIcon()}
            size={24}
            color={colors.icon}
            style={styles.icon}
          />
          <Text style={styles.message} numberOfLines={2}>
            {message}
          </Text>
        </View>

        {action && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              action.onPress();
              hideToast();
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.actionText}>{action.label}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.closeButton}
          onPress={hideToast}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="close" size={20} color={colors.icon} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 12,
  },
  message: {
    flex: 1,
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  actionButton: {
    marginLeft: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 6,
  },
  actionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  closeButton: {
    marginLeft: 8,
    padding: 4,
  },
});


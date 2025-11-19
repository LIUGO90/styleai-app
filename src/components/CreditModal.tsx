import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { useCredit } from '@/contexts/CreditContext';
import BuyCredit from './BuyCredit';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

interface CreditModalProps {
  visible: boolean;
  onClose: () => void;
}


export const CreditModal: React.FC<CreditModalProps> = ({ visible, onClose }) => {
  const { user } = useAuth();
  const router = useRouter();
  const { refreshCredits } = useCredit();
  const [scaleAnim] = useState(new Animated.Value(0.3));
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      // 每次打开 Modal 时刷新积分，确保显示最新数据
      refreshCredits();
      
      // 弹出动画 - 缩放 + 淡入
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 10,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {      // 关闭动画 - 缩小 + 淡出
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.3,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }

  }, [visible, refreshCredits]);


  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/40" style={{ height: Dimensions.get('window').height * 0.65, backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
        {/* 背景遮罩 */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={onClose}
          className="absolute inset-0"
        />

        {/* 积分卡片 */}
        <View
          className="bg-white rounded-3xl shadow-2xl overflow-hidden py-4"
          style={{
            shadowColor: '#000',
            shadowOpacity: 0.3,
            shadowRadius: 20,
            elevation: 10,
          }}
        >
        <BuyCredit />
        </View>
      </View>
    </Modal>
  );
};

export default CreditModal;


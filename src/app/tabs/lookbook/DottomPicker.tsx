import { Modal, View, Text, Pressable, StyleSheet } from "react-native";
import { PropsWithChildren } from "react";
import { GestureHandlerRootView, Gesture } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from "react-native-reanimated";

type Props = PropsWithChildren<{
  isVisible: boolean;
  onClose: () => void;
}>;

export default function DottomPicker({ isVisible, children, onClose }: Props) {
  const translateY = useSharedValue(0);
  const modalHeight = 400; // 模态框高度

  const panGesture = Gesture.Pan()
    .onStart(() => {
      // 手势开始时的处理
    })
    .onUpdate((event) => {

      // 只允许向下拖拽
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      // 如果拖拽距离超过阈值，关闭模态框
      if (event.translationY > 100 || event.velocityY > 500) {
        runOnJS(onClose)();
      } else {
        // 否则回弹到原位置
        translateY.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  const handleClose = () => {
    translateY.value = 0; // 重置位置
    onClose();
  };

  return (
    <Modal animationType="slide" transparent={true} visible={isVisible}>
      <GestureHandlerRootView style={styles.modalOverlay}>
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <Animated.View
          style={[styles.modalContent, animatedStyle]}
          {...panGesture}
        >
          {/* 顶部拖拽指示器 */}
          <View style={styles.dragIndicator} />

          {/* 关闭按钮 */}
          {/* <View style={styles.header}>
              <Pressable onPress={handleClose} style={styles.closeButton}>
                <MaterialIcons name="close" color="black" size={24} />
              </Pressable>
            </View> */}

          {/* 内容区域 */}
          <View style={styles.content}>{children}</View>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  backdrop: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: "white",
    height: "45%",
    width: "100%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: "#D1D5DB",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
});

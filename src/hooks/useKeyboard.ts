import { useState, useEffect } from 'react';
import { Keyboard, KeyboardEvent, Platform } from 'react-native';

interface KeyboardState {
  keyboardHeight: number;
  isKeyboardVisible: boolean;
}

export function useKeyboard() {
  const [keyboardState, setKeyboardState] = useState<KeyboardState>({
    keyboardHeight: 0,
    isKeyboardVisible: false,
  });

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e: KeyboardEvent) => {
        setKeyboardState({
          keyboardHeight: e.endCoordinates.height,
          isKeyboardVisible: true,
        });
      }
    );

    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardState({
          keyboardHeight: 0,
          isKeyboardVisible: false,
        });
      }
    );

    return () => {
      showSubscription?.remove();
      hideSubscription?.remove();
    };
  }, []);

  return keyboardState;
}

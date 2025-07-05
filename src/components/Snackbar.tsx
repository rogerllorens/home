import React from 'react';
import { Animated, StyleSheet, Text } from 'react-native';

interface Props {
  message: string;
  visible: boolean;
  onHide: () => void;
}

export default function Snackbar({ message, visible, onHide }: Props) {
  const slide = React.useRef(new Animated.Value(80)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.timing(slide, { toValue: 0, duration: 200, useNativeDriver: true }).start(() =>
        setTimeout(onHide, 1500)
      );
    }
  }, [visible]);

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slide }] }]}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#333',
    padding: 12,
    borderRadius: 8,
  },
  text: { color: 'white', textAlign: 'center' },
});

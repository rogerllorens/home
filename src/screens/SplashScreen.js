import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import { useSettingsStore } from '../store/settingsStore';

export default function SplashScreen({ onFinish }) {
  const powerSaving = useSettingsStore(state => state.powerSaving);
  useEffect(() => {
    const timer = setTimeout(onFinish, 2000);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <View style={styles.container} accessible accessibilityLabel="Splash screen">
      {!powerSaving && (
        <LottieView
          source={require('../assets/splash.json')}
          autoPlay
          loop={false}
          style={{ width: 200, height: 200 }}
        />
      )}
      <Text style={styles.tagline}>Escanea y genera códigos al instante</Text>
      <TouchableOpacity
        accessibilityRole="button"
        onPress={onFinish}
        style={styles.skip}
      >
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skip: {
    marginTop: 20,
  },
  skipText: {
    color: '#0055AA',
  },
  tagline: {
    marginTop: 10,
    fontSize: 16,
    color: '#0055AA',
  },
});

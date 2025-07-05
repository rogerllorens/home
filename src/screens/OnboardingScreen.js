import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  useColorScheme,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { useSettingsStore } from '../store/settingsStore';
import { set, get } from '../services/storageService';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
} from 'react-native-reanimated';
import { shouldReduceMotion } from '../utils/accessibility';
import { recordMetric } from '../utils/storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AppButton from './AppButton';
import theme from '../utils/theme';
import { useTranslation } from 'react-i18next';

const slides = [
  {
    key: '1',
    textKey: 'onboarding_scan',
    tipKey: 'onboarding_tip_scan',
    anim: require('../assets/onboard_scan.json'),
    icon: 'qr-code-scanner',
  },
  {
    key: '2',
    textKey: 'onboarding_generate',
    tipKey: 'onboarding_tip_generate',
    anim: require('../assets/onboard_generate.json'),
    icon: 'edit',
  },
  { key: '3', textKey: 'onboarding_done', icon: 'star' },
];

export default function OnboardingScreen({ onDone }) {
  const { width } = useWindowDimensions();
  const scheme = useColorScheme();
  const colors = theme[scheme === 'dark' ? 'lowLight' : 'light'];
  const { t } = useTranslation();
  const powerSaving = useSettingsStore(state => state.powerSaving);
const progress = useSharedValue(0);
const [reduceMotion, setReduceMotion] = useState(false);
const listRef = useRef(null);
const [variant] = useState(Math.random() < 0.5 ? 'A' : 'B');
const [rating, setRating] = useState(0);
const [haptics, setHaptics] = useState(true);

  useEffect(() => {
    recordMetric('onboard_variant', variant);
    shouldReduceMotion().then(setReduceMotion);
    get<boolean>('haptics').then(v => v !== null && setHaptics(v));
  }, [variant]);

  const handleNext = async () => {
    if (haptics) ReactNativeHapticFeedback.trigger('impactLight');
    if (progress.value < slides.length - 1) {
      progress.value += 1;
      listRef.current.scrollToIndex({ index: progress.value });
    } else {
      await set('onboarded', 'true');
      recordMetric('onboard_rating', rating);
      onDone();
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -progress.value * width }],
  }));

  return (
    <View style={styles.container} accessible accessibilityLabel="Onboarding screens">
      <View style={styles.progressBarContainer}>
        <Animated.View
          style={[
            styles.progressBar,
            {
              width: (progress.value / (slides.length - 1)) * 100 + '%',
              backgroundColor:
                progress.value >= slides.length - 1 ? colors.action : colors.primary,
            },
          ]}
        />
      </View>
      {variant === 'A' ? (
        <Text style={[styles.progress, { color: colors.primary }]}>{`${progress.value + 1}/${slides.length}`}</Text>
      ) : (
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                progress.value === i && { backgroundColor: colors.primary },
              ]}
            />
          ))}
        </View>
      )}
      <Animated.View style={[styles.slider, { width: width * slides.length }, animatedStyle]}>
        {slides.map((item, idx) => (
          <View
            key={item.key}
            style={[styles.slide, { width }]}
            testID={`onboard-slide-${idx}`}
          >
            {item.anim && !powerSaving && (
              <LottieView
                source={item.anim}
                autoPlay
                loop
                style={{ width: 120, height: 120 }}
              />
            )}
            {item.icon && (
              <Icon name={item.icon} size={48} color="#FF7A00" style={{ marginTop: 10 }} />
            )}
            <Text allowFontScaling style={styles.text}>{t(item.textKey)}</Text>
            {item.tipKey && <Text allowFontScaling style={styles.tip}>{t(item.tipKey)}</Text>}
            {item.key === '4' && (
              <View style={styles.ratingRow}>
                {[1, 2, 3, 4, 5].map(n => (
                  <TouchableOpacity
                    key={n}
                    onPress={() => { if (haptics) ReactNativeHapticFeedback.trigger('selection'); setRating(n); }}
                    style={[styles.rateButton, rating >= n && styles.rateActive]}
                  >
                    <Icon name={rating >= n ? 'star' : 'star-border'} size={24} color={rating >= n ? '#FF7A00' : '#ccc'} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ))}
      </Animated.View>
      <AppButton
        testID="onboard-skip"
        title={progress.value < slides.length - 1 ? t('next') : t('start')}
        onPress={handleNext}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  slider: { flexDirection: 'row' },
  slide: { justifyContent: 'center', alignItems: 'center', padding: 20 },
  text: { fontSize: 18, textAlign: 'center' },
  tip: { marginTop: 10, color: '#666', textAlign: 'center' },
  progress: { position: 'absolute', top: 40, right: 20 },
  dots: { position: 'absolute', top: 40, right: 20, flexDirection: 'row' },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginHorizontal: 2,
  },
  ratingRow: { flexDirection: 'row', marginTop: 20 },
  rateButton: {
    padding: 6,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
  },
  rateActive: { backgroundColor: '#FF7A00', borderColor: '#FF7A00' },
  progressBarContainer: { position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: '#ccc' },
  progressBar: { height: 4 },
});

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ScanScreen from '../src/screens/ScanScreen';
import GenerateScreen from '../src/screens/GenerateScreen';
import GalleryScreen from '../src/screens/GalleryScreen';
import HistoryScreen from '../src/screens/HistoryScreen';
import AnalyticsScreen from '../src/screens/AnalyticsScreen';
import OCRScreen from '../src/screens/OCRScreen';
import SettingsScreen from '../src/screens/SettingsScreen';
import SplashScreen from '../src/screens/SplashScreen';
import OnboardingScreen from '../src/screens/OnboardingScreen';
import theme from '../src/utils/theme';
import { useColorScheme, AccessibilityInfo } from 'react-native';
import { recordMetric } from '../src/utils/storage';
import { get, set, STORAGE_KEYS } from '../src/services/storageService';
import VoiceControl from '../src/screens/VoiceControl';
import { navigationRef, navigate } from './NavigationService';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function Tabs() {
  const scheme = useColorScheme();
  const [highContrast, setHighContrast] = React.useState(false);
  const [initialRoute, setInitialRoute] = React.useState('Scan');
  const [order, setOrder] = React.useState([
    'Scan', 'Generate', 'Gallery', 'History', 'Analytics', 'OCR', 'Settings'
  ]);
  React.useEffect(() => {
    get('active_tab').then(r => r && setInitialRoute(r));
    get(STORAGE_KEYS.TAB_ORDER).then(o => o && setOrder(o));
  }, []);
  React.useEffect(() => {
    AccessibilityInfo.isHighContrastEnabled().then(setHighContrast);
    const subscription = AccessibilityInfo.addEventListener('highContrastChanged', setHighContrast);
    return () => {
      if (subscription && typeof subscription.remove === 'function') {
        subscription.remove();
      } else {
        AccessibilityInfo.removeEventListener?.('highContrastChanged', setHighContrast);
      }
    };
  }, []);
  const activeColors = highContrast
    ? theme.highContrast
    : theme[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <Tab.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
      tabBarActiveTintColor: activeColors.primary,
      tabBarStyle: { backgroundColor: activeColors.background },
      swipeEnabled: true,
    }}
      onStateChange={state => {
        const name = state.history[state.history.length - 1]?.key?.split('-')[0];
        name && set('active_tab', name);
      }}
    >
      {order.map(key => (
        <Tab.Screen key={key} name={key} component={
          key === 'Scan' ? ScanScreen :
          key === 'Generate' ? GenerateScreen :
          key === 'Gallery' ? GalleryScreen :
          key === 'History' ? HistoryScreen :
          key === 'Analytics' ? AnalyticsScreen :
          key === 'OCR' ? OCRScreen : SettingsScreen
        } />
      ))}
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const [ready, setReady] = React.useState(false);
  const [onboarded, setOnboarded] = React.useState(false);
  React.useEffect(() => {
    get('onboarded').then(value => {
      setOnboarded(value === 'true');
      setReady(true);
    });
  }, []);

  if (!ready) return null;

  const SplashWrapper = ({ navigation }) => (
    <SplashScreen onFinish={() => navigation.replace(onboarded ? 'Tabs' : 'Onboarding')} />
  );

  const OnboardWrapper = ({ navigation }) => (
    <OnboardingScreen onDone={() => navigation.replace('Tabs')} />
  );

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashWrapper} />
        {!onboarded && <Stack.Screen name="Onboarding" component={OnboardWrapper} />}
        <Stack.Screen name="Tabs" component={Tabs} />
      </Stack.Navigator>
      <VoiceControl
        onCommand={(cmd, param) => {
          if (cmd === 'scan_gallery') navigate('Gallery');
          else if (cmd === 'scan') navigate('Scan');
          else if (cmd === 'generate_link') navigate('Generate', { url: param });
          else if (cmd === 'generate') navigate('Generate');
          else if (cmd === 'history') navigate('History');
          else if (cmd === 'ocr' || cmd === 'translate') navigate('OCR', { lang: param });
          recordMetric(cmd, true);
        }}
      />
    </NavigationContainer>
  );
}

export default React.memo(AppNavigator);

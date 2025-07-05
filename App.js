import React, { useEffect } from 'react';
import AppNavigator from './navigation/AppNavigator';
import { initSentry } from './src/services/errorReporting';
import { isDeviceSecure } from './src/services/security';
import { Alert } from 'react-native';
import GlobalErrorBoundary from './src/components/GlobalErrorBoundary';
import OfflineBanner from './src/components/OfflineBanner';
import { loadSettings } from './src/store/settingsStore';
import './src/i18n';
import { I18nextProvider } from 'react-i18next';
import i18n from './src/i18n';

initSentry();

export default function App() {
  useEffect(() => {
    if (!isDeviceSecure()) {
      Alert.alert('Advertencia','El dispositivo está rooteado o no es seguro');
    }
    loadSettings();
  }, []);
  return (
    <GlobalErrorBoundary>
      <I18nextProvider i18n={i18n}>
        <OfflineBanner />
        <AppNavigator />
      </I18nextProvider>
    </GlobalErrorBoundary>
  );
}

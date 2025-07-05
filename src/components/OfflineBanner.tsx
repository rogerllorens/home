import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import theme from '../utils/theme';
import { useColorScheme } from 'react-native';

export default function OfflineBanner() {
  const [connected, setConnected] = React.useState(true);
  const scheme = useColorScheme();
  const colors = theme[scheme === 'dark' ? 'lowLight' : 'light'];

  React.useEffect(() => {
    const sub = NetInfo.addEventListener(state => setConnected(!!state.isConnected));
    return () => sub();
  }, []);

  if (connected) return null;
  return (
    <View style={[styles.banner, { backgroundColor: colors.action }]}>
      <Text style={{ color: '#fff' }}>Sin conexión. Algunas funciones estarán limitadas.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { padding: 4, alignItems:'center' }
});

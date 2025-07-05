import React, { useState, useEffect } from 'react';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Switch,
  Alert,
  StyleSheet,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import QRCode from 'react-native-qrcode-svg';
import { launchImageLibrary } from 'react-native-image-picker';
import Share from 'react-native-share';
import { saveScan } from '../utils/storage';
import { get } from '../services/storageService';
import { createDynamicQr } from '../services/dynamicQr';
import theme from '../utils/theme';
import { useColorScheme } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import AppButton from './AppButton';
import { qrUrlSchema } from '../validation/schemas';
import { ERROR_INVALID_URL } from '../constants/messages';

const templates = [
  { fg: '#000000', bg: '#FFFFFF' },
  { fg: '#0055AA', bg: '#FFFFFF' },
  { fg: '#FFFFFF', bg: '#0055AA' },
];

export default function GenerateScreen() {
  const [value, setValue] = useState('https://example.com');
  const [color, setColor] = useState('#000000');
  const [logo, setLogo] = useState(null);
  const [template, setTemplate] = useState(0);
  const [dynamicUrl, setDynamicUrl] = useState(null);
  const [counts, setCounts] = useState(null);
  const [password, setPassword] = useState('');
  const [expires, setExpires] = useState('');
  const [loading, setLoading] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [haptics, setHaptics] = useState(true);
  const [msg, setMsg] = useState('');
  const scheme = useColorScheme();
  const colors = theme[scheme === 'dark' ? 'lowLight' : 'light'];

  useEffect(() => { get<boolean>('haptics').then(v => v !== null && setHaptics(v)); }, []);

  const pickLogo = async () => {
    const res = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 1,
      includeBase64: false,
      cropping: true,
    });
    if (res.assets && res.assets[0]) {
      setLogo(res.assets[0].uri);
    }
  };

  const generateDynamic = async () => {
    const parsed = qrUrlSchema.safeParse(value);
    if (!parsed.success) {
      Alert.alert('Error', ERROR_INVALID_URL);
      return;
    }
    setLoading(true);
    setMsg('');
    const options: any = {};
    if (password) options.password = password;
    if (expires) options.expiresAt = expires;
    const data = await createDynamicQr(value, options);
    setLoading(false);
    if (data && data.url) {
      setDynamicUrl(data.url);
      data.counts && setCounts(data.counts);
      setMsg('QR generado \u2705');
      if (haptics) ReactNativeHapticFeedback.trigger('impactMedium');
      if (autoSave) saveCurrent();
    } else {
      Alert.alert('Error', 'No se pudo generar el QR');
    }
  };

  const saveCurrent = () => {
    const record = {
      type: 'generated',
      content: dynamicUrl || value,
      date: new Date().toISOString(),
      favorite: false,
      password,
      expires,
    };
    saveScan(record);
  };

  const shareCurrent = () => {
    Share.open({ url: dynamicUrl || value }).catch(() => {});
  };

  const copyLink = () => {
    if (dynamicUrl) {
      Clipboard.setString(dynamicUrl);
      setMsg('Enlace copiado');
    }
  };

  const qrValue = dynamicUrl || value;
  const style = templates[template];

  return (
    <View style={{ flex: 1, alignItems: 'center', padding: 20 }}>
      {loading ? (
        <BlurView style={[styles.preview, styles.center]} blurAmount={15} blurType={scheme === 'dark' ? 'dark' : 'light'}>
          <View style={{ width: 220, height: 220, backgroundColor: '#E0E0E0', borderRadius: 12 }} />
        </BlurView>
      ) : (
        <BlurView
          style={styles.preview}
          blurAmount={15}
          blurType={scheme === 'dark' ? 'dark' : 'light'}
        >
          <QRCode
            value={qrValue}
            size={220}
            color={color || style.fg}
            backgroundColor={style.bg}
            logo={logo}
            logoSize={40}
          />
        </BlurView>
      )}
      {logo && (
        <Image source={{ uri: logo }} style={{ width: 40, height: 40, marginTop: 10 }} />
      )}
      <TextInput
        value={value}
        onChangeText={setValue}
        style={{ borderBottomWidth: 1, width: '100%', marginTop: 20, color: colors.text }}
        placeholder="Enter text or URL"
        placeholderTextColor={colors.text}
      />
      <TextInput
        value={color}
        onChangeText={setColor}
        style={{ borderBottomWidth: 1, width: '100%', marginTop: 20, color: colors.text }}
        placeholder="Color hex"
        placeholderTextColor={colors.text}
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        style={{ borderBottomWidth: 1, width: '100%', marginTop: 20, color: colors.text }}
        placeholder="Contrase\u00f1a opcional"
        placeholderTextColor={colors.text}
        secureTextEntry
      />
      <TextInput
        value={expires}
        onChangeText={setExpires}
        style={{ borderBottomWidth: 1, width: '100%', marginTop: 20, color: colors.text }}
        placeholder="Expira (YYYY-MM-DD)"
        placeholderTextColor={colors.text}
      />
      <View style={{ flexDirection: 'row', marginTop: 20 }}>
        {templates.map((t, i) => (
          <TouchableOpacity
            key={i}
            accessibilityRole="button"
            accessibilityLabel={`Select template ${i + 1}`}
            onPress={() => setTemplate(i)}
            style={{ margin: 4, borderWidth: template === i ? 2 : 0, borderColor: colors.action }}
          >
            <QRCode
              value="demo"
              size={50}
              color={t.fg}
              backgroundColor={t.bg}
            />
          </TouchableOpacity>
        ))}
        <AppButton onPress={pickLogo} title="Logo" variant="secondary" style={{ marginLeft: 10 }} />
      </View>
      <View style={{ flexDirection: 'row', marginTop: 20 }}>
        <AppButton onPress={generateDynamic} title="Dynamic QR" style={{ marginRight: 10 }} />
        <AppButton onPress={saveCurrent} title="Guardar" variant="secondary" style={{ marginRight: 10 }} />
        <AppButton onPress={shareCurrent} title="Compartir" variant="secondary" />
      </View>
      {dynamicUrl && (
        <View style={{ flexDirection: 'row', marginTop: 10, alignItems: 'center' }}>
          <AppButton onPress={copyLink} title="Copiar enlace" variant="secondary" style={{ marginRight: 10 }} />
          <AppButton onPress={() => Share.open({ message: `QR escaneos ${counts?.total || 0}` }).catch(() => {})} title="Compartir estadísticas" variant="secondary" />
        </View>
      )}
      <View style={{ flexDirection: 'row', marginTop: 10, alignItems: 'center' }}>
        <Text style={{ color: colors.text, marginRight: 8 }}>Auto guardar</Text>
        <Switch value={autoSave} onValueChange={setAutoSave} />
      </View>
      {counts && (
        <View style={{ marginTop: 20 }}>
          <Text style={{ color: colors.text }}>
            Escaneos hoy: {counts.today} / Total: {counts.total}
          </Text>
        </View>
      )}
      {!!msg && (
        <Text style={{ marginTop: 10, color: colors.action }}>{msg}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  preview: {
    padding: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#ffffff30',
    marginBottom: 10,
  },
  center: { justifyContent:'center', alignItems:'center' },
});

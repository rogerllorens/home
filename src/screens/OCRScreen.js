import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  TextInput,
  Share,
  Clipboard,
  Vibration,
  StyleSheet,
  Switch,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { BlurView } from '@react-native-community/blur';
import NetInfo from '@react-native-community/netinfo';
import theme from '../utils/theme';
import { useColorScheme } from 'react-native';
import { imageToText, cloudOcr, smartOcr } from '../services/ocr';
import { translate } from '../services/translate';
import { speak } from '../services/voice';
import { saveScan } from '../utils/storage';

export default function OCRScreen() {
  const scheme = useColorScheme();
  const colors = theme[scheme === 'dark' ? 'lowLight' : 'light'];
  const [path, setPath] = useState('');
  const [text, setText] = useState('');
  const [translation, setTranslation] = useState('');
  const [targetLang, setTargetLang] = useState('es');
  const [loading, setLoading] = useState(false);
  const phases = ['Carga de imagen', 'Preprocesamiento', 'Reconocimiento', 'Postprocesamiento'];
  const [phase, setPhase] = useState(0);
  const [progress, setProgress] = useState(0);
  const [translating, setTranslating] = useState(false);
  const [useCloud, setUseCloud] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const sub = NetInfo.addEventListener(s => setOffline(!s.isConnected));
    return () => sub();
  }, []);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      {offline && (
        <Text style={{ color: colors.action, marginBottom: 10 }}>
          OCR sin conexión: usando modo offline
        </Text>
      )}
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Select image"
        onPress={async () => {
          const res = await launchImageLibrary({ mediaType: 'photo' });
          if (res.assets && res.assets[0]) {
            setPath(res.assets[0].uri);
            setImageLoaded(false);
            setText('');
            setTranslation('');
          }
        }}
        style={[styles.neuButton, { padding: 10 }]}
      >
        <Text style={{ color: colors.action }}>📷 Seleccionar imagen</Text>
      </TouchableOpacity>
      {path ? (
        <View style={{ alignItems: 'center', marginTop: 10 }}>
          {!imageLoaded && (
            <View style={{ width: 200, height: 200, borderRadius: 10, backgroundColor: '#E0E0E0' }} />
          )}
          <Image
            source={{ uri: path }}
            style={{ width: 200, height: 200, borderRadius: 10, position: imageLoaded ? 'relative' : 'absolute', opacity: imageLoaded ? 1 : 0 }}
            onLoadEnd={() => setImageLoaded(true)}
          />
          <TouchableOpacity accessibilityRole="button" onPress={() => Clipboard.setString(path)} style={{ marginTop: 5 }}>
            <Text style={{ color: colors.action }}>Copiar URI</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={async () => {
              try {
                const crop = await require('react-native-image-crop-picker').openCropper({ path, width: 300, height: 300 });
                setPath(crop.path);
              } catch (e) {
                console.warn('crop cancelled', e);
              }
            }}
            style={{ marginTop: 5 }}
          >
            <Text style={{ color: colors.action }}>Editar imagen</Text>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', marginTop: 5 }}>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={async () => setPath(await require('../services/imageTools').rotateImage(path, 90))}
              style={[styles.neuButton, styles.smallButton]}
            >
              <Text style={{ color: colors.action }}>↻</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={async () => setPath(await require('../services/imageTools').adjustImage(path, { brightness: 0.1 }))}
              style={[styles.neuButton, styles.smallButton]}
            >
              <Text style={{ color: colors.action }}>+☀️</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={async () => setPath(await require('../services/imageTools').sharpenImage(path))}
              style={[styles.neuButton, styles.smallButton]}
            >
              <Text style={{ color: colors.action }}>🔪</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }}>
            <Text style={{ color: colors.text, marginRight: 8 }}>OCR Premium</Text>
            <Switch value={useCloud} onValueChange={setUseCloud} />
          </View>
        </View>
      ) : null}
      {path ? (
        <TouchableOpacity
          accessibilityRole="button"
          onPress={async () => {
            setPhase(0);
            setProgress(0);
            setLoading(true);
            const result = await smartOcr(path, useCloud, p => {
              setProgress(Math.round(p * 100));
              const idx = p < 0.25 ? 0 : p < 0.5 ? 1 : p < 0.75 ? 2 : 3;
              setPhase(idx);
            });
            if (useCloud && result) setTargetLang(targetLang);
            setProgress(100);
            setText(result);
            speak(result);
            setLoading(false);
          }}
          style={{ marginTop: 10 }}
        >
          <Text style={{ color: colors.action }}>Extraer texto</Text>
        </TouchableOpacity>
      ) : null}
      {loading && (
        <View style={{ marginTop: 10, alignItems: 'center' }}>
          <Text style={{ color: colors.text }}>
            {phases[phase]} (fase {phase + 1}/4)
          </Text>
          <Text style={{ color: colors.text }}>{progress}%</Text>
        </View>
      )}
      {text ? (
        <BlurView
          style={{ padding: 15, marginTop: 20, width: '100%', borderRadius: 12, overflow: 'hidden' }}
          blurAmount={10}
          blurType={scheme === 'dark' ? 'dark' : 'light'}
        >
          <Text style={{ color: colors.text, marginBottom: 10, fontWeight: '600' }}>Texto extraído</Text>
          {editing ? (
            <TextInput
              value={text}
              onChangeText={setText}
              multiline
              style={{ color: colors.text, borderColor: colors.primary, borderWidth: 1, padding: 4 }}
            />
          ) : (
            <Text style={{ color: colors.text }}>{text}</Text>
          )}
          <View style={{ flexDirection: 'row', marginTop: 10, justifyContent: 'space-around' }}>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => {
              Clipboard.setString(text);
              Vibration.vibrate(30);
              setCopied(true);
              setTimeout(() => setCopied(false), 1000);
            }}
            style={[styles.neuButton, styles.smallButton]}
          >
            <Text style={{ color: colors.action }}>{copied ? '✅ Copiado' : 'Copiar'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => Share.share({ message: text })}
            style={[styles.neuButton, styles.smallButton]}
          >
            <Text style={{ color: colors.action }}>Compartir</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => setEditing(e => !e)}
            style={[styles.neuButton, styles.smallButton]}
          >
            <Text style={{ color: colors.action }}>{editing ? 'Listo' : 'Editar'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => saveScan({ type: 'text', content: text, date: new Date().toISOString(), favorite: false })}
            style={[styles.neuButton, styles.smallButton]}
          >
            <Text style={{ color: colors.action }}>Guardar</Text>
          </TouchableOpacity>
          </View>
          <TextInput
            value={targetLang}
            onChangeText={setTargetLang}
            placeholder="Idioma destino (es)"
            placeholderTextColor={colors.text}
            style={{ borderBottomWidth: 1, borderColor: colors.primary, color: colors.text, marginBottom: 8 }}
          />
          <TouchableOpacity
            accessibilityRole="button"
            onPress={async () => {
              setTranslating(true);
              const result = await translate(text, targetLang);
              setTranslation(result || '');
              setTranslating(false);
              if (result === null) {
                Vibration.vibrate(30);
                return;
              }
              saveScan({ type: 'translation', content: result, date: new Date().toISOString(), favorite: false, tags: ['translation'] });
              speak(result);
            }}
            style={{ marginTop: 10 }}
          >
            <Text style={{ color: colors.action }}>Traducir</Text>
          </TouchableOpacity>
          {translating && <ActivityIndicator style={{ marginTop: 10 }} color={colors.action} />}
          {translation ? <Text style={{ color: colors.text, marginTop: 10 }}>{translation}</Text> : null}
        </BlurView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  neuButton: {
    backgroundColor: '#ffffff30',
    borderRadius: 8,
    shadowColor: '#fff',
    shadowOffset: { width: -2, height: -2 },
    shadowOpacity: 0.6,
    shadowRadius: 3,
    elevation: 2,
  },
  smallButton: {
    padding: 6,
    marginHorizontal: 2,
  },
});

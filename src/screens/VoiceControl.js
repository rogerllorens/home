import React, { useState, useRef, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Vibration, Animated, ToastAndroid } from 'react-native';
import { recordMetric } from '../utils/storage';
import { initVoice, startListening, stopListening, speak } from '../services/voice';

export default function VoiceControl({ onCommand }) {
  const [listening, setListening] = useState(false);
  const [banner, setBanner] = useState('');
  const [pending, setPending] = useState(null);
  const pulse = useRef(new Animated.Value(1)).current;
  const ring = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    initVoice(text => {
      setListening(false);
      stopListening();
      Vibration.vibrate(50);
      const { cmd, param } = parseCommand(text);
      if (cmd) {
        setBanner(`\uD83D\uDCAC ${text}`);
        setPending({ cmd, param });
        setTimeout(() => {
          if (pending && pending.cmd === cmd) {
            setBanner(`Comando recibido: ${cmd}`);
            ToastAndroid.show(`\u2714 ${cmd}`, ToastAndroid.SHORT);
            recordMetric('voice_success', cmd);
            onCommand && onCommand(cmd, param);
            speak(`Ejecutando ${cmd}`);
            setTimeout(() => setBanner(''), 1000);
            setPending(null);
          }
        }, 1000);
      } else {
        setBanner(`No entiendo: ${text}`);
        recordMetric('voice_fail', text);
        setTimeout(() => setBanner(''), 1500);
      }
    });
  }, [onCommand, pending]);

  useEffect(() => {
    if (listening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.4, duration: 500, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 500, useNativeDriver: true }),
        ]),
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(ring, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(ring, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
      ).start();
    } else {
      pulse.stopAnimation();
      pulse.setValue(1);
      ring.stopAnimation();
      ring.setValue(0);
    }
  }, [listening, pulse]);

  const toggle = () => {
    if (listening) {
      stopListening();
      setListening(false);
    } else {
      setListening(true);
      startListening();
    }
  };

  const parseCommand = text => {
    const parts = text.split(/ y /i);
    const parseOne = t => {
      if (/escanea.*galeri/.test(t)) return { cmd: 'scan_gallery' };
      if (/escanea/.test(t)) return { cmd: 'scan' };
      const gen = t.match(/generar qr de (.+)/);
      if (gen) return { cmd: 'generate_link', param: gen[1] };
      if (/generar/.test(t)) return { cmd: 'generate' };
      const tr = t.match(/traducir a (.+)/);
      if (tr) return { cmd: 'translate', param: tr[1] };
      if (/historial/.test(t)) return { cmd: 'history' };
      return null;
    };
    for (const p of parts) {
      const res = parseOne(p);
      if (res) return res;
    }
    return { cmd: null };
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      <Animated.View style={[styles.ring, { opacity: ring }]}/>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Voice command"
        onPress={toggle}
        style={[styles.button, listening && styles.active, { transform: [{ scale: pulse }] }]}
      >
        <Text style={styles.text}>{listening ? '🎤...' : '🎤'}</Text>
      </TouchableOpacity>
      {banner ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{banner}</Text>
          {pending && (
            <TouchableOpacity onPress={() => { setPending(null); setBanner(''); }}>
              <Text style={[styles.bannerText,{textDecorationLine:'underline'}]}>Cancelar</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', bottom: 100, right: 20 },
  button: {
    backgroundColor: '#00000080',
    padding: 10,
    borderRadius: 25,
  },
  active: { backgroundColor: '#FF7A00' },
  text: { color: 'white', fontSize: 20 },
  banner: {
    position: 'absolute',
    bottom: 150,
    right: 10,
    backgroundColor: '#00000080',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center'
  },
  bannerText: { color: 'white' },
  ring: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#FF8800',
    alignSelf: 'center',
    top: -8,
  },
});

import React, { useState, useRef, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  TouchableOpacity,
  Vibration,
  StyleSheet,
  useColorScheme,
  Animated,
  PanResponder,
  Linking,
  Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { BlurView } from '@react-native-community/blur';
import { RNCamera } from 'react-native-camera';
import { verifyUrl } from '../services/safeBrowsing';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { lookupUPC } from '../services/productLookup';
import { imageToText } from '../services/ocr';
import { decodeDamaged } from '../services/barcodeScan';
import { speak } from '../services/voice';
import { recordMetric } from '../utils/storage';
import Geolocation, { GeolocationResponse } from '@react-native-community/geolocation';
import { launchImageLibrary } from 'react-native-image-picker';
import theme from '../utils/theme';
import { get, set, remove, STORAGE_KEYS } from '../services/storageService';
import useScanHistory from '../hooks/useScanHistory';
import Snackbar from './Snackbar';
import AppButton from './AppButton';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';

export default function ScanScreen() {
  const cameraRef = useRef(null);
  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
  const buttonScale = useRef(new Animated.Value(1)).current;
  const flipAnim = useRef(new Animated.Value(0)).current;
  const [flash, setFlash] = useState<'auto' | 'on' | 'off'>('auto');
  const [zoom, setZoom] = useState(0);
  const [focusPoint, setFocusPoint] = useState<{x:number;y:number}|null>(null);
  const [batch, setBatch] = useState(false);
  const [count, setCount] = useState(0);
  const scanned = useRef(new Set());
  const batchRecords = useRef<any[]>([]);
  const [visibleCodes, setVisibleCodes] = useState([]);
  const [objects, setObjects] = useState([]);
  const [barTypes, setBarTypes] = useState<string[]>(['qr','upc_a','upc_e','aztec','datamatrix','pdf417']);
  const [cameraType, setCameraType] = useState(RNCamera.Constants.Type.back);
  const highlightAnim = useRef(new Animated.Value(0)).current;
  const [borderColor, setBorderColor] = useState('white');
  const [batchStart, setBatchStart] = useState(null);
  const [camLayout, setCamLayout] = useState({ width: 1, height: 1 });
  const scheme = useColorScheme();
  const colors = theme[scheme === 'dark' ? 'lowLight' : 'light'];
  const { t } = useTranslation();
  const [recent, setRecent] = useState([]);
  const [showTip, setShowTip] = useState(false);
  const { add, history, undo, increment } = useScanHistory();
  const [snack, setSnack] = useState<string | null>(null);
  const [gettingLoc, setGettingLoc] = useState(false);
  const [locError, setLocError] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [haptics, setHaptics] = useState(true);

  React.useEffect(() => {
    get<{start: number; count: number}>(STORAGE_KEYS.BATCH_STATE).then(state => {
      if (state) {
        setBatch(true);
        setCount(state.count);
        setBatchStart(state.start);
      }
    });
    get<string[]>(STORAGE_KEYS.BARCODE_TYPES).then(v => v && setBarTypes(v));
    get<boolean>('haptics').then(v => v !== null && setHaptics(v));
    const timer = setTimeout(() => {
      if (!cameraReady) setCameraError(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // placeholder object detection
    const timer = setInterval(() => {
      setObjects([{ id: Date.now(), bounds: { origin: { x: 80, y: 120 }, size: { width: 80, height: 60 } }, label: 'Objeto' }])
      setTimeout(() => setObjects([]), 1500)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  useFocusEffect(
    React.useCallback(() => {
      get<string[]>(STORAGE_KEYS.BARCODE_TYPES).then(v => v && setBarTypes(v));
    }, [])
  );

  React.useEffect(() => {
    if (batch && batchStart) {
      set(STORAGE_KEYS.BATCH_STATE, { start: batchStart, count });
    }
  }, [count, batch, batchStart]);

  React.useEffect(() => {
    setRecent(history.slice(0, 5));
    get<string>(STORAGE_KEYS.TIP_SCAN).then(v => { if (!v) setShowTip(true); });
  }, [history]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 20 || Math.abs(g.dy) > 20,
      onPanResponderRelease: (_, g) => {
        if (g.numberActiveTouches >= 3 && g.dx < -40) {
          undo();
          return;
        }
        if (Math.abs(g.dx) > Math.abs(g.dy) && Math.abs(g.dx) > 40) {
          setCameraType(t =>
            t === RNCamera.Constants.Type.back ? RNCamera.Constants.Type.front : RNCamera.Constants.Type.back,
          );
        } else if (g.dy > 40) {
          launchImageLibrary({ mediaType: 'photo' }).then(res => {
            if (res.assets && res.assets[0]) onBarCodeRead({ data: res.assets[0].uri, type: 'image' });
          });
        }
      },
    }),
  ).current;

  const triggerButtonAnim = () => {
    buttonScale.setValue(0.9);
    Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true }).start();
  };

  const getLocation = (): Promise<GeolocationResponse | null> => {
    setGettingLoc(true);
    setLocError(false);
    return new Promise(resolve => {
      const id = setTimeout(() => {
        setGettingLoc(false);
        setLocError(true);
        resolve(null);
      }, 10000);
      Geolocation.getCurrentPosition(
        pos => {
          clearTimeout(id);
          setGettingLoc(false);
          resolve(pos);
        },
        err => {
          clearTimeout(id);
          setGettingLoc(false);
          setLocError(true);
          resolve(null);
        },
        { timeout: 10000 }
      );
    });
  };

  const onBarCodeRead = async ({ data, type, bounds }: { data: string; type?: string; bounds?: any }) => {
    const t0 = Date.now();
    if (batch) {
      setCount(c => c + 1);
      if (!batchStart) setBatchStart(Date.now());
    }
    Animated.sequence([
      Animated.timing(highlightAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: false,
      }),
      Animated.timing(highlightAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start();

    let product = null;
    let success = true;
    const tags = [];
    if (/^https?:\/\//.test(data)) {
      const { isSafe } = await verifyUrl(data);
      success = isSafe;
      tags.push('url');
      if (!safe) {
        Alert.alert('Enlace inseguro', 'Esta URL podría ser peligrosa');
      }
    } else if (/^\d{12,13}$/.test(data)) {
      product = await lookupUPC(data);
      tags.push('product');
      if (!product) {
        Alert.alert('Sin resultados', 'No se encontró información del producto');
      }
    } else if (/^WIFI:/.test(data) || /^BEGIN:VCARD/.test(data)) {
      // handle wifi or vcard codes
      tags.push('contact');
    } else {
      // if from gallery try barcode decode first
      if (data.startsWith('file:')) {
        const decoded = await decodeDamaged(data);
        if (decoded) {
          data = decoded;
        } else {
          const text = await imageToText(data);
          data = text;
        }
      }
      tags.push('text');
    }

    if (haptics) {
      ReactNativeHapticFeedback.trigger(
        success ? 'impactLight' : 'notificationError'
      );
    }
    setBorderColor(success ? 'green' : 'red');
    setSnack(success ? 'Código abierto' : 'Escaneo falló');
    speak(success ? data : 'Escaneo falló');
    setTimeout(() => setBorderColor('white'), 500);

    const record = {
      type,
      content: data,
      product,
      date: new Date().toISOString(),
      favorite: false,
      tags,
    };
    if (batch) {
      batchRecords.current.push(record);
    }
    const loc = await getLocation();
    if (loc) {
      record.location = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
    } else if (locError) {
      Alert.alert(t('location_fail'), '', [
        { text: t('retry'), onPress: () => onBarCodeRead({ data, type, bounds }) },
        { text: t('enter_manually'), style: 'cancel' },
      ]);
    }
    add(record);
    increment(data);
    recordMetric('scan_latency_ms', Date.now() - t0);
    if (bounds) {
      setVisibleCodes(c => [
        ...c,
        {
          id: Date.now() + Math.random(),
          bounds,
          label: product ? product.title || 'Producto' : /^https?:/.test(data) ? 'Abrir' : 'Código',
          data,
        },
      ]);
      setTimeout(() => {
        setVisibleCodes(c => c.slice(1));
      }, 1500);
    }
  };

  const handleMulti = ({ barcodes }) => {
    barcodes.forEach(b => {
      if (!scanned.current.has(b.data)) {
        scanned.current.add(b.data);
        onBarCodeRead(b);
      }
    });
    setCount(scanned.current.size);
    setVisibleCodes(b => b); // trigger re-render
  };

  return (
    <View style={{ flex: 1 }} testID="scan-screen">
      <RNCamera
        ref={cameraRef}
        style={{
          flex: 1,
          transform: [
            {
              rotateY: flipAnim.interpolate({ inputRange: [0, 90], outputRange: ['0deg', '90deg'] })
            },
          ],
        }}
        accessibilityLabel="camera"
        flashMode={
          flash === 'on'
            ? RNCamera.Constants.FlashMode.torch
            : flash === 'off'
            ? RNCamera.Constants.FlashMode.off
            : RNCamera.Constants.FlashMode.auto
        }
        zoom={zoom}
        autoFocusPointOfInterest={focusPoint || undefined}
        barCodeTypes={barTypes}
        onBarCodeRead={onBarCodeRead}
        onGoogleVisionBarcodesDetected={handleMulti}
        onCameraReady={() => setCameraReady(true)}
        type={cameraType}
        {...panResponder.panHandlers}
      />
      <View
        style={StyleSheet.absoluteFill}
        onStartShouldSetResponder={() => true}
        onResponderRelease={e => {
          const { locationX, locationY } = e.nativeEvent;
          setFocusPoint({ x: locationX / camLayout.width, y: locationY / camLayout.height });
        }}
      />
      {!cameraReady && !cameraError && (
        <View style={[styles.loading, styles.skel]}/>
      )}
      {cameraError && (
        <View style={styles.loading}><Text style={{color:'#fff'}}>{t('camera_unavailable')}</Text></View>
      )}
      {recent.length ? (
        <View style={styles.recentContainer}>
          <Animated.ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {recent.map((r, i) => (
              <View key={i} style={styles.recentCard}>
                <Text style={{ color: colors.text }} numberOfLines={1}>{r.content}</Text>
              </View>
            ))}
          </Animated.ScrollView>
        </View>
      ) : null}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.overlay,
          {
            borderColor: highlightAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [borderColor, colors.primary],
            }),
          },
        ]}
      />
      {focusPoint && (
        <View
          style={[
            styles.focusDot,
            {
              left: camLayout.width * focusPoint.x - 10,
              top: camLayout.height * focusPoint.y - 10,
            },
          ]}
        />
      )}
      {visibleCodes.map(c => (
        <TouchableOpacity
          key={c.id}
          activeOpacity={0.7}
          style={[
            styles.codeBox,
            {
              left: c.bounds.origin.x,
              top: c.bounds.origin.y,
              width: c.bounds.size.width,
              height: c.bounds.size.height,
            },
          ]}
        >
          <Text style={styles.codeLabel}>{c.label}</Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Abrir resultado"
            accessibilityHint="Abre o muestra el contenido escaneado"
            style={styles.openBtn}
            onPress={() => {
              if (/^https?:/.test(c.data)) {
                Linking.openURL(c.data);
              } else {
                Alert.alert('Contenido', c.data);
              }
            }}
          >
            <Text style={{ color: '#fff' }}>Abrir</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      ))}
      {objects.map(o => (
        <View
          key={o.id}
          style={[
            styles.objBox,
            {
              left: o.bounds.origin.x,
              top: o.bounds.origin.y,
              width: o.bounds.size.width,
              height: o.bounds.size.height,
            },
          ]}
        >
          <Text style={styles.objLabel}>{o.label}</Text>
        </View>
      ))}
      {showTip && (
        <View style={styles.tipBox} pointerEvents="none">
          <Text style={{ color: '#fff' }}>Desliza para cambiar cámara o abrir galería</Text>
        </View>
      )}
      {batch && batchStart && (
        <>
          <Animated.Text
            style={[
              styles.stats,
              {
                transform: [{ scale: highlightAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.2] }) }],
                opacity: highlightAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.7] }),
              },
            ]}
          >
            {`Batch ${count} - ${(count / ((Date.now() - batchStart) / 60000)).toFixed(1)} scans/min`}
          </Animated.Text>
          <View style={styles.batchBubble}><Text style={styles.batchText}>{count}</Text></View>
        </>
      )}
      <BlurView
        style={[styles.controls, styles.glass]}
        blurAmount={20}
        blurType={scheme === 'dark' ? 'dark' : 'light'}
      >
        <AnimatedTouchable
          accessibilityLabel={t('toggle_flash')}
          onPress={() => {
            triggerButtonAnim();
            if (haptics) ReactNativeHapticFeedback.trigger('impactLight');
            setFlash(f => (f === 'auto' ? 'on' : f === 'on' ? 'off' : 'auto'));
          }}
          style={[styles.button, { transform: [{ scale: buttonScale }] }]}
        >
          <Icon
            name={flash === 'on' ? 'flash-on' : flash === 'off' ? 'flash-off' : 'wb-auto'}
            size={24}
            color={colors.action}
          />
        </AnimatedTouchable>
        <AnimatedTouchable
          accessibilityLabel={t('switch_camera')}
          onPress={() => {
            triggerButtonAnim();
            Animated.timing(flipAnim, {
              toValue: 90,
              duration: 200,
              useNativeDriver: true,
            }).start(() => {
              setCameraType(t =>
                t === RNCamera.Constants.Type.back ? RNCamera.Constants.Type.front : RNCamera.Constants.Type.back,
              );
              flipAnim.setValue(0);
            });
          }}
          style={[styles.button, { transform: [{ scale: buttonScale }] }]}
        >
          <Icon name="flip-camera-ios" size={24} color={colors.action} />
        </AnimatedTouchable>
        <AnimatedTouchable
          accessibilityLabel={t('toggle_batch')}
          onPress={() => {
            triggerButtonAnim();
            if (haptics) ReactNativeHapticFeedback.trigger('impactLight');
            setBatch(b => {
              if (!b) {
                setCount(0);
                batchRecords.current = [];
                const start = Date.now();
                setBatchStart(start);
                set(STORAGE_KEYS.BATCH_STATE, { start, count: 0 });
              } else {
                const totals = batchRecords.current.reduce((acc, r) => {
                  r.tags?.forEach(t => {
                    acc[t] = (acc[t] || 0) + 1;
                  });
                  return acc;
                }, {} as any);
                const summary = Object.entries(totals)
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(' ');
                setSnack(`Batch completado: ${count}`);
                if (summary) setTimeout(() => setSnack(`${count} - ${summary}`), 2000);
                batchRecords.current = [];
                setBatchStart(null);
                remove(STORAGE_KEYS.BATCH_STATE);
              }
              return !b;
            });
          }}
          style={[styles.button, { transform: [{ scale: buttonScale }] }]}
        >
          <Icon name="layers" size={24} color={colors.action} />
        </AnimatedTouchable>
        <AnimatedTouchable
          accessibilityLabel={t('open_gallery')}
          onPress={async () => {
            triggerButtonAnim();
            const res = await launchImageLibrary({ mediaType: 'photo' });
            if (res.assets && res.assets[0]) {
              onBarCodeRead({ data: res.assets[0].uri, type: 'image' });
            }
          }}
          style={[styles.button, { transform: [{ scale: buttonScale }] }]}
        >
          <Icon name="photo-library" size={24} color={colors.action} />
        </AnimatedTouchable>
      </BlurView>
      <View style={styles.zoomContainer} pointerEvents="box-none">
        <Slider
          style={{ height: 200 }}
          orientation="vertical"
          minimumValue={0}
          maximumValue={1}
          value={zoom}
          onValueChange={setZoom}
        />
      </View>
      {gettingLoc && (
        <View style={styles.loading}><Text style={{color:'#fff'}}>{t('getting_location')}</Text></View>
      )}
      <Snackbar message={snack || ''} visible={!!snack} onHide={() => setSnack(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: '25%',
    left: '10%',
    width: '80%',
    height: '40%',
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 10,
  },
  controls: {
    position: 'absolute',
    bottom: 20,
    flexDirection: 'row',
    alignSelf: 'center',
  },
  glass: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#ffffff30',
  },
  button: {
    margin: 10,
    padding: 10,
    minWidth: 44,
    minHeight: 44,
    backgroundColor: '#ffffff30',
    borderRadius: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  stats: {
    position: 'absolute',
    top: 40,
    alignSelf: 'center',
    color: 'white',
    backgroundColor: '#00000080',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 4,
  },
  codeBox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#FF7A00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeLabel: {
    backgroundColor: '#000000a0',
    color: 'white',
    fontSize: 12,
    paddingHorizontal: 4,
  },
  openBtn: {
    backgroundColor: '#FF7A00',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  batchBubble: {
    position: 'absolute',
    top: 90,
    right: 20,
    backgroundColor: '#FF7A00',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  batchText: { color: '#fff', fontWeight: 'bold' },
  recentContainer: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
  },
  recentCard: {
    backgroundColor: '#00000080',
    padding: 6,
    marginHorizontal: 4,
    borderRadius: 6,
    minWidth: 80,
  },
  tipBox: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    backgroundColor: '#00000080',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  loading: {
    position: 'absolute',
    top: '45%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  skel: {
    width: 200,
    height: 200,
    backgroundColor: '#E0E0E0',
    borderRadius: 12
  },
  objBox: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: '#00FFAA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  objLabel: {
    backgroundColor: '#000000a0',
    color: 'white',
    fontSize: 12,
    paddingHorizontal: 4,
  },
  focusDot: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#FF7A00',
    borderRadius: 10,
  },
  zoomContainer: {
    position: 'absolute',
    right: 10,
    top: '25%',
    bottom: '25%',
    justifyContent: 'center',
  },
});


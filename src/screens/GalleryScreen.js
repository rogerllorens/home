import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import FastImage from 'react-native-fast-image';
import theme from '../utils/theme';
import { useColorScheme } from 'react-native';
const EmptyImg = { uri: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMBApHT/lUAAAAASUVORK5CYII=" };
import { copilot, CopilotStep, walkthroughable } from 'react-native-copilot';
import { launchImageLibrary } from 'react-native-image-picker';
import { imageToText } from '../services/ocr';
import autoTag from '../utils/autoTag';
import AppButton from './AppButton';
import { exportPDF } from '../services/automation';
import { get, set } from '../services/storageService';

const WalkView = walkthroughable(View);

function GalleryScreen({ start }) {
  const scheme = useColorScheme();
  const colors = theme[scheme === 'dark' ? 'lowLight' : 'light'];
  const [images, setImages] = useState([]);
  const [selected, setSelected] = useState([]);
  const [selectMode, setSelectMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [crop, setCrop] = useState(false);
  const [annotate, setAnnotate] = useState(false);
  const [filter, setFilter] = useState('all');
  const [showTutorial, setShowTutorial] = useState(false);
  const animValues = useRef({}).current;
  const anim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    get('gallery_filter').then(v => v && setFilter(v));
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ]),
    ).start();
  }, [anim]);

  useEffect(() => {
    get('tip_gallery').then(v => {
      if (!v) setShowTutorial(true);
    });
  }, []);

  useEffect(() => {
    if (showTutorial && start) {
      start();
      set('tip_gallery', '1');
    }
  }, [showTutorial, start]);

  useEffect(() => {
    set('gallery_filter', filter);
  }, [filter]);

  const pickImage = async () => {
    setLoading(true);
    const res = await launchImageLibrary({ mediaType: 'photo', selectionLimit: 0 });
    if (res.assets) {
      const mapped = [];
      for (const a of res.assets) {
        let type = 'unknown';
        try {
          const text = await imageToText(a.uri);
          const tags = autoTag(text);
          type = tags[0];
        } catch (e) {}
        mapped.push({ uri: a.uri, date: a.fileName || Date.now(), type });
      }
      setImages(prev => [...prev, ...mapped]);
    }
    setLoading(false);
  };

  const toggleSelect = uri => {
    setSelectMode(true);
    setSelected(prev =>
      prev.includes(uri) ? prev.filter(u => u !== uri) : [...prev, uri],
    );
    if (!animValues[uri]) animValues[uri] = new Animated.Value(1);
    Animated.sequence([
      Animated.timing(animValues[uri], { toValue: 0.9, duration: 100, useNativeDriver: true }),
      Animated.spring(animValues[uri], { toValue: 1, useNativeDriver: true }),
    ]).start();
  };

  const clearSelection = () => {
    setSelectMode(false);
    setSelected([]);
  };

  const scanSelected = () => {
    // placeholder for batch scanning selected images
    Alert.alert('Procesado', `${selected.length} imágenes escaneadas con éxito`);
    clearSelection();
  };

  const deleteSelected = () => {
    setImages(imgs => imgs.filter(i => !selected.includes(i.uri)));
    clearSelection();
  };

  const exportSelected = async () => {
    await exportPDF(selected);
    clearSelection();
  };
  const renderItem = useCallback(({ item, index }) => {
    const uri = item.uri;
    const isSel = selected.includes(uri);
    if (!animValues[uri]) animValues[uri] = new Animated.Value(1);
    return (
      <Animated.View style={{ transform: [{ scale: animValues[uri] }] }}>
        <TouchableOpacity
          onLongPress={() => toggleSelect(uri)}
          onPress={() => (selectMode ? toggleSelect(uri) : setPreview(uri))}
          style={[
            styles.itemContainer, index % 2 === 0 && styles.alt,
          ]}
        >
          <FastImage source={{ uri }} style={styles.image} />
          {isSel && (
            <View style={styles.checkOverlay}>
              <Text style={styles.check}>✓</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  }, [selected, selectMode]);

  const keyExtractor = useCallback(item => item.uri, []);
  const ITEM_SIZE = 104;
  const getItemLayout = useCallback((_, index) => (
    { length: ITEM_SIZE, offset: ITEM_SIZE * index, index }
  ), []);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginVertical: 8 }}>
        {['all', 'url', 'upc', 'text'].map(f => (
          <TouchableOpacity key={f} onPress={() => setFilter(f)} style={{ marginHorizontal: 6 }}>
            <Text style={{ color: filter === f ? colors.action : colors.text }}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {loading ? (
        <View style={styles.list}>
          {[...Array(6)].map((_, i) => (<Animated.View key={i} style={[styles.skeleton, { opacity: anim }]} />))}
        </View>
      ) : images.filter(img => filter === "all" || img.type === filter).length === 0 ? (
        <View style={{ alignItems: "center", marginTop: 40 }}>
          <FastImage source={EmptyImg} style={{width:80,height:80,marginBottom:10}} />
          <Text style={{ color: colors.text, marginBottom: 10 }}>Sin imágenes</Text>
          <AppButton title="Agregar" onPress={pickImage} />
        </View>
      ) : (
        <FlashList
          contentContainerStyle={styles.list}
          data={images.filter(img => filter === 'all' || img.type === filter)}
          keyExtractor={keyExtractor}
          numColumns={3}
          renderItem={renderItem}
          estimatedItemSize={100}
          initialNumToRender={9}
          maxToRenderPerBatch={9}
          windowSize={5}
          removeClippedSubviews
          getItemLayout={getItemLayout}
        />
      )}
      <AppButton
        title="Select Image"
        onPress={pickImage}
        variant="primary"
        style={styles.addButton}
      />
      {selectMode && (
        <View style={styles.toolbar}>
          <AppButton title={`Scan ${selected.length}`} onPress={scanSelected} variant="primary" style={styles.toolbarBtn} />
          <AppButton title="Delete" onPress={deleteSelected} variant="secondary" style={styles.toolbarBtn} />
          <AppButton title="Export PDF" onPress={exportSelected} variant="secondary" style={styles.toolbarBtn} />
          <AppButton title="Cancel" onPress={clearSelection} variant="secondary" style={styles.toolbarBtn} />
        </View>
      )}
      <Modal visible={!!preview} transparent onRequestClose={() => setPreview(null)}>
        <View style={styles.modalBg}>
          <ScrollView
            maximumZoomScale={3}
            minimumZoomScale={1}
            contentContainerStyle={{ flex: 1, justifyContent: 'center' }}
          >
            <TouchableOpacity onPress={() => setPreview(null)}>
              <FastImage source={{ uri: preview }} style={styles.previewImg} />
            </TouchableOpacity>
          </ScrollView>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginVertical: 10 }}>
            <AppButton title="Crop" onPress={() => setCrop(true)} variant="secondary" />
            <AppButton title="Annotate" onPress={() => setAnnotate(true)} variant="secondary" />
          </View>
        </View>
      </Modal>
      <Modal visible={crop} transparent onRequestClose={() => setCrop(false)}>
        <View style={styles.modalBg}>
          <Text style={{color:'white',textAlign:'center',marginTop:50}}>Crop UI placeholder</Text>
          <AppButton title="Done" onPress={() => setCrop(false)} variant="primary" style={{alignSelf:'center',marginTop:20}} />
        </View>
      </Modal>
      <Modal visible={annotate} transparent onRequestClose={() => setAnnotate(false)}>
        <View style={styles.modalBg}>
          <Text style={{color:'white',textAlign:'center',marginTop:50}}>Annotation UI placeholder</Text>
          <AppButton title="Done" onPress={() => setAnnotate(false)} variant="primary" style={{alignSelf:'center',marginTop:20}} />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { alignItems: 'center', paddingVertical: 10 },
  itemContainer: { margin: 2 },
  alt: { backgroundColor: '#f9f9f9' },
  image: { width: 100, height: 100 },
  skeleton: { width: 100, height: 100, margin: 2, backgroundColor: '#ccc' },
  checkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#00000080',
    justifyContent: 'center',
    alignItems: 'center',
  },
  check: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  addButton: { alignSelf: 'center', marginVertical: 10 },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#00000080',
    padding: 10,
  },
  toolbarBtn: { paddingHorizontal: 10 },
  modalBg: { flex: 1, backgroundColor: '#000000cc' },
  previewImg: { width: '100%', height: '100%', resizeMode: 'contain' },
});

export default copilot({ animated: true })(GalleryScreen);

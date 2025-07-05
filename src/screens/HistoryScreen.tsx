import React, { useEffect, useState, useRef, useCallback } from 'react';
import { LayoutAnimation } from 'react-native';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  PanResponder,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import MapView, { Marker, Callout } from 'react-native-maps';
import { copilot, CopilotStep, walkthroughable } from 'react-native-copilot';
import { BlurView } from '@react-native-community/blur';
const EmptyImg = { uri: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMBApHT/lUAAAAASUVORK5CYII=" };
import { get, set, STORAGE_KEYS } from '../services/storageService';
import { loadHistory, toggleFavorite, recordMetric, loadFolders, moveToFolder, addComment } from '../utils/storage';
import { useHistoryStore, loadHistoryStore } from '../store/historyStore';
import theme from '../utils/theme';
import { useColorScheme, Vibration, Share, Clipboard } from 'react-native';

const WalkView = walkthroughable(View);
import { exportPDF } from '../services/automation';
import ConfirmModal from '../components/ConfirmModal';

function HistoryScreen({ start }) {
  const history = useHistoryStore(state => state.history);
  const setHistory = useHistoryStore(state => state.setHistory);
  const [loading, setLoading] = useState(true);
  const [showFav, setShowFav] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [search, setSearch] = useState('');
  const [recentOnly, setRecentOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState('all');
  const [filterTag, setFilterTag] = useState('');
  const [filterFolder, setFilterFolder] = useState('all');
  const [folders, setFolders] = useState<{id:string,name:string}[]>([]);
  const [suggested, setSuggested] = useState(null);
  const [showMore, setShowMore] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState([]);
  const [showTip, setShowTip] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const scheme = useColorScheme();
  const colors = theme[scheme === 'dark' ? 'lowLight' : 'light'];

  useEffect(() => {
    (async () => {
      const fav = await get<string>('hist_showFav');
      const rec = await get<string>('hist_recent');
      const fType = await get<string>('hist_type');
      const fTag = await get<string>('hist_tag');
      const fFolder = await get<string>('hist_folder');
      const flds = await loadFolders();
      if (fav) setShowFav(fav === '1');
      if (rec) setRecentOnly(rec === '1');
      if (fType) setFilterType(fType);
      if (fTag) setFilterTag(fTag);
      if (fFolder) setFilterFolder(fFolder);
      setFolders(flds);
      const seen = await get<string>('tip_history');
      if (!seen) setShowTutorial(true);
    })();
  }, []);

  useEffect(() => {
    if (showTutorial && start) {
      start();
      set('tip_history', '1');
    }
  }, [showTutorial, start]);

  useEffect(() => {
    set('hist_showFav', showFav ? '1' : '0');
  }, [showFav]);
  useEffect(() => {
    set('hist_recent', recentOnly ? '1' : '0');
  }, [recentOnly]);
  useEffect(() => {
    set('hist_type', filterType);
  }, [filterType]);
  useEffect(() => {
    set('hist_tag', filterTag);
  }, [filterTag]);
  useEffect(() => {
    set('hist_folder', filterFolder);
  }, [filterFolder]);

  const mapResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 20,
      onPanResponderRelease: (_, g) => {
        if (g.dy > 40) setShowMap(false);
      },
    }),
  ).current;

  useEffect(() => {
    loadHistoryStore().then(data => {
      setLoading(false);
      const counts = {};
      data.forEach(d => {
        d.tags?.forEach(t => {
          counts[t] = (counts[t] || 0) + 1;
        });
      });
      const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
      if (top) setSuggested(top[0]);
    });
    get<string>(STORAGE_KEYS.TIP_MAP).then(v => {
      if (!v) setShowTip(true);
    });
  }, []);

  const filtered = history
    .filter(h => (showFav ? h.favorite : true))
    .filter(h =>
      search.trim()
        ? h.content.toLowerCase().includes(search.toLowerCase()) ||
          (h.tags && h.tags.join(' ').includes(search.toLowerCase()))
        : true,
    )
    .filter(h =>
      recentOnly ? Date.now() - new Date(h.date).getTime() < 7 * 86400000 : true,
    )
    .filter(h => (filterType !== 'all' ? h.tags?.includes(filterType) : true))
    .filter(h => (filterTag ? h.tags?.includes(filterTag) : true))
    .filter(h => (filterFolder !== 'all' ? h.folderId === filterFolder : true));

  const paged = filtered.slice(0, page * 20);

  const toggleSelect = idx => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelected(s =>
      s.includes(idx) ? s.filter(i => i !== idx) : [...s, idx],
    );
  };

  const exportCsv = async () => {
    const csv = history.map(h => `${h.date},${h.content}`).join('\n');
    await Share.share({ message: csv });
  };

  const exportSelectedPdf = async () => {
    const texts = selected.map(i => history[i].content);
    await exportPDF(texts);
    setSelected([]);
    setSelectMode(false);
  };

  const exportSelectedZip = async () => {
    const texts = selected.map(i => history[i].content);
    await exportZIP(texts);
    setSelected([]);
    setSelectMode(false);
  };

  const moveSelectedToVault = async () => {
    for (const i of selected) {
      await saveToVault(`scan_${Date.now()}_${i}`, history[i]);
    }
    setSelected([]);
    setSelectMode(false);
  };

  const keyExtractor = useCallback((_, index) => index.toString(), []);

  const renderItem = useCallback(({ item, index }) => <HistoryItem item={item} index={index} />, [selectMode, selected]);

  const ITEM_HEIGHT = 80;
  const getItemLayout = useCallback((_, index) => (
    { length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index }
  ), []);

  const HistoryItem = React.memo(({ item, index }) => {
    const content = (
      <TouchableOpacity
        style={{ marginHorizontal: 10, marginBottom: 10 }}
        onLongPress={() => {
          setSelectMode(true);
          toggleSelect(index);
        }}
        onPress={() => (selectMode ? toggleSelect(index) : null)}
      >
      <BlurView
        style={[
          styles.card,
          styles.glass,
          styles.shadow,
          selectMode && selected.includes(index) && styles.selCard,
          index % 2 === 0 && { backgroundColor: colors.neutral },
        ]}
        blurAmount={15}
        blurType={scheme === 'dark' ? 'dark' : 'light'}
      >
        <View style={styles.iconColumn}>
          <Text style={styles.icon}>{item.tags?.[0] === 'url' ? '🌐' : item.tags?.[0] === 'product' ? '📦' : '🔤'}</Text>
        </View>
        <View style={styles.textColumn}>
          <Text style={{ color: colors.text }} numberOfLines={1}>{item.content}</Text>
          <Text style={{ color: colors.text, fontSize: 12 }}>{new Date(item.date).toLocaleString()}</Text>
          {item.tags?.map(t => (
            <Text key={t} style={styles.tag}>{t}</Text>
          ))}
        </View>
        {!selectMode && (
        <View style={styles.actionColumn}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Share"
            style={styles.actionButton}
            onPress={() => {
              Share.share({ message: item.content });
              recordMetric('share', item.content);
            }}
          >
            <Text>↗</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Copy"
            style={styles.actionButton}
            onPress={() => {
              Clipboard.setString(item.content);
              Vibration.vibrate(50);
              recordMetric('copy', item.content);
            }}
          >
            <Text>📋</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Toggle favorite"
            style={styles.actionButton}
            onPress={async () => {
              await toggleFavorite(index);
              const data = await loadHistoryStore();
              setHistory(data);
              recordMetric('favorite_toggle', index);
            }}
          >
            <Text style={{ color: item.favorite ? colors.action : colors.text }}>★</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Move"
            style={styles.actionButton}
            onPress={async () => {
              if (folders[0]) {
                await moveToFolder(index, folders[0].id);
                const data = await loadHistoryStore();
                setHistory(data);
              }
            }}
          >
            <Text>📂</Text>
          </TouchableOpacity>
        </View>
        )}
      </BlurView>
      </TouchableOpacity>
    );
    if (index === 0 && showTutorial) {
      return (
        <CopilotStep text="Toca para ver acciones" order={2} name="item">
          <WalkView>{content}</WalkView>
        </CopilotStep>
      );
    }
    return content;
  });

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <TouchableOpacity accessibilityRole="button" onPress={() => { setShowFav(f => !f); recordMetric('filter_fav', !showFav); }}>
          <Text style={{ color: colors.action }}>{showFav ? 'Show All' : 'Show Favorites'}</Text>
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" onPress={() => { setRecentOnly(r => !r); recordMetric('filter_recent', !recentOnly); }}>
          <Text style={{ color: colors.action }}>{recentOnly ? 'Todo' : 'Últimos 7 días'}</Text>
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" onPress={() => { setShowMap(true); recordMetric('open_map', 1); }}>
          <Text style={{ color: colors.action }}>Map</Text>
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" onPress={exportCsv}>
          <Text style={{ color: colors.action }}>Exportar</Text>
        </TouchableOpacity>
      </View>
      <TextInput
        placeholder="Search"
        value={search}
        onChangeText={setSearch}
        style={[styles.search, { borderColor: colors.primary, color: colors.text }]}
        placeholderTextColor={colors.text}
      />
      {suggested && !filterTag && (
        <Text style={{ marginLeft: 10, color: colors.text }}>
          Sugerencia de filtro: {suggested}
        </Text>
      )}
      <CopilotStep text="Filtros principales" order={1} name="filters">
      <WalkView style={styles.filterRow}>
        <TouchableOpacity onPress={() => setShowMore(m => !m)} accessibilityRole="button">
          <Text style={{ color: colors.action }}>{showMore ? 'Menos ▲' : 'Más filtros ▼'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setFilterType(t => t === 'url' ? 'all' : 'url')} accessibilityRole="button">
          <Text style={{ color: colors.action }}>{filterType === 'url' ? 'URL ✓' : 'URL'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setFilterType(t => t === 'product' ? 'all' : 'product')} accessibilityRole="button">
          <Text style={{ color: colors.action }}>{filterType === 'product' ? 'Prod ✓' : 'Prod'}</Text>
        </TouchableOpacity>
      </WalkView>
      </CopilotStep>
      {showMore && (
        <View style={styles.filterRow}>
          <TextInput
            placeholder="Tag"
            value={filterTag}
            onChangeText={setFilterTag}
            style={[styles.search, { flex: 1, borderColor: colors.primary, color: colors.text }]}
            placeholderTextColor={colors.text}
          />
          <TextInput
            placeholder="Folder"
            value={filterFolder}
            onChangeText={setFilterFolder}
            style={[styles.search, { flex: 1, borderColor: colors.primary, color: colors.text, marginLeft: 8 }]}
            placeholderTextColor={colors.text}
          />
        </View>
      )}
      <Text style={{ marginLeft: 10, color: colors.text }}>
        {filtered.length} resultados
      </Text>
      {loading ? (
        Array.from({ length: 5 }).map((_, i) => (
          <View key={i} style={[styles.card, { backgroundColor: '#E0E0E0' }]}>
            <View style={[styles.iconColumn, { backgroundColor: '#D0D0D0', height: 20 }]} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <View style={{ backgroundColor: '#D0D0D0', height: 14, width: '80%', marginBottom: 4 }} />
              <View style={{ backgroundColor: '#D0D0D0', height: 12, width: '60%' }} />
            </View>
          </View>
        ))
      ) : filtered.length === 0 ? (
        <View style={{ alignItems: 'center', marginTop: 40 }}>
          <Image source={EmptyImg} style={{width:80,height:80,marginBottom:10}} />
          <Text style={{ color: colors.text, marginBottom: 10 }}>
            Aún no tienes escaneos.
          </Text>
          <AppButton title="Escanear ahora" onPress={() => {}} />
        </View>
      ) : (
        <FlashList
          data={paged}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          estimatedItemSize={80}
          initialNumToRender={20}
          maxToRenderPerBatch={20}
          windowSize={5}
          removeClippedSubviews
          getItemLayout={getItemLayout}
          onEndReached={() => {
            if (filtered.length > page * 20) setPage(p => p + 1);
          }}
          onEndReachedThreshold={0.2}
        />
      )}
      {selectMode && (
        <View style={styles.batchBar}>
          <TouchableOpacity accessibilityRole="button" onPress={() => {
            const items = selected.map(i => history[i].content).join('\n');
            Share.share({ message: items });
          }}>
            <Text style={{ color: colors.action }}>Compartir</Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" onPress={exportSelectedPdf}>
            <Text style={{ color: colors.action }}>PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" onPress={exportSelectedZip}>
            <Text style={{ color: colors.action }}>ZIP</Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" onPress={moveSelectedToVault}>
            <Text style={{ color: colors.action }}>Vault</Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" onPress={() => setConfirmDelete(true)}>
            <Text style={{ color: colors.action }}>Borrar</Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" onPress={async () => {
            for (const i of selected) {
              history[i].favorite = !history[i].favorite;
            }
            await set(STORAGE_KEYS.SCAN_HISTORY, history);
            setHistory([...history]);
          }}>
            <Text style={{ color: colors.action }}>Fav</Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" onPress={() => {
            setSelected([]);
            setSelectMode(false);
          }}>
            <Text style={{ color: colors.action }}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      )}
      <Modal visible={showMap} animationType="slide">
        <BlurView style={{ flex: 1 }} blurAmount={20} blurType={scheme === 'dark' ? 'dark' : 'light'}>
          <MapView style={{ flex: 1 }} {...mapResponder.panHandlers}>
            {history.map((h, idx) =>
              h.location ? (
                <Marker key={idx} coordinate={h.location}>
                  <Callout>
                    <Text>{h.content}</Text>
                  </Callout>
                </Marker>
              ) : null,
            )}
          </MapView>
        </BlurView>
        {showTip && (
          <View style={styles.tip}>
            <Text style={{ color: colors.text, marginBottom: 10 }}>Desliza hacia abajo para cerrar el mapa.</Text>
            <TouchableOpacity accessibilityRole="button" onPress={() => { set(STORAGE_KEYS.TIP_MAP, '1'); setShowTip(false); }}>
              <Text style={{ color: colors.action }}>Entendido</Text>
            </TouchableOpacity>
          </View>
        )}
        <TouchableOpacity accessibilityRole="button" style={styles.close} onPress={() => setShowMap(false)}>
          <Text style={{ color: colors.action }}>Close</Text>
        </TouchableOpacity>
      </Modal>
      <ConfirmModal
        visible={confirmDelete}
        message="\u00bfBorrar elementos seleccionados?"
        onConfirm={async () => {
          const newHist = history.filter((_, i) => !selected.includes(i));
          await set(STORAGE_KEYS.SCAN_HISTORY, newHist);
          setHistory(newHist);
          setSelected([]);
          setSelectMode(false);
          setConfirmDelete(false);
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 10 },
  search: {
    borderWidth: 1,
    padding: 6,
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: 6,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconColumn: { width: 30 },
  textColumn: { flex: 1 },
  actionColumn: { flexDirection: 'row' },
  actionButton: {
    marginHorizontal: 4,
    backgroundColor: '#ffffff30',
    padding: 4,
    borderRadius: 8,
    shadowColor: '#fff',
    shadowOffset: { width: -2, height: -2 },
    shadowOpacity: 0.6,
    shadowRadius: 3,
    elevation: 2,
  },
  icon: { fontSize: 20 },
  tag: {
    fontSize: 10,
    color: '#666',
  },
  selCard: {
    backgroundColor: '#0055AA20',
  },
  glass: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#ffffff30',
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
    marginBottom: 6,
  },
  batchBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    backgroundColor: '#00000010',
  },
  tip: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
    backgroundColor: '#ffffffcc',
    padding: 10,
    borderRadius: 8,
  },
  close: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: '#00000080',
    padding: 6,
    borderRadius: 4,
  },
});

export default copilot({ animated: true })(HistoryScreen);

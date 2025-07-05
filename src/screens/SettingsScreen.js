import React from 'react';
import { ScrollView, Text, View, useColorScheme, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import theme from '../utils/theme';
import { get, set, remove, STORAGE_KEYS, getSecure, setSecure } from '../services/storageService';
import DraggableFlatList from 'react-native-draggable-flatlist';
const pkg = require('../../package.json');

function useColors() {
  const scheme = useColorScheme();
  return theme[scheme === 'dark' ? 'dark' : 'light'];
}

function Privacy() {
  const colors = useColors();
  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      accessible accessibilityLabel="Privacy policy">
      <Text style={[styles.h1, { color: colors.primary }]}>Política de Privacidad</Text>
      <Text style={styles.p}>Recopilamos registros de escaneo (tipo, contenido, fecha y ubicación opcional) y métricas anónimas. No compartimos datos personales y puedes borrar tu historial en cualquier momento.</Text>
      <Text style={styles.p}>Solo enviamos a servicios externos el mínimo necesario (ej. URL o UPC) para validar o buscar productos. Puedes revocar permisos de micrófono y ubicación desde Ajustes.</Text>
      <Text style={styles.p}>Para dudas: legal@scanly.app</Text>
    </ScrollView>
  );
}

function FAQ() {
  const colors = useColors();
  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      accessible accessibilityLabel="Frequently asked questions">
      <Text style={[styles.h1, { color: colors.primary }]}>FAQ</Text>
      <Text style={styles.p}>¿Qué información recoge Scanly? Solo datos del código y fecha; la ubicación solo se guarda si lo permites.</Text>
      <Text style={styles.p}>¿Puedo eliminar mi historial? Sí, desde la pantalla History o en Ajustes.</Text>
      <Text style={styles.p}>¿Por qué solicita micrófono y ubicación? Para comandos de voz y mapa de escaneos, pero son opcionales.</Text>
    </ScrollView>
  );
}

function Terms() {
  const colors = useColors();
  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      accessible accessibilityLabel="Terms and conditions">
      <Text style={[styles.h1, { color: colors.primary }]}>Términos y Condiciones</Text>
      <Text style={styles.p}>Al usar Scanly aceptas una licencia personal y revocable. No garantizamos disponibilidad continua y no somos responsables de errores de escaneo o traducción.</Text>
      <Text style={styles.p}>Nos reservamos el derecho de suspender el servicio por uso indebido. Las disputas se regirán por las leyes aplicables del desarrollador.</Text>
    </ScrollView>
  );
}

function Customize() {
  const colors = useColors();
  const [types, setTypes] = React.useState(['qr', 'upc_a', 'upc_e', 'aztec', 'datamatrix', 'pdf417']);
  const [haptics, setHaptics] = React.useState(true);
  const [power, setPower] = React.useState(false);
  const [order, setOrder] = React.useState(['Scan','Generate','Gallery','History','Analytics','OCR','Settings']);
  React.useEffect(() => {
    get(STORAGE_KEYS.BARCODE_TYPES).then(v => v && setTypes(v));
    get('haptics').then(v => v !== null && setHaptics(v));
    get(STORAGE_KEYS.POWER_SAVING).then(v => v !== null && setPower(v));
    get(STORAGE_KEYS.TAB_ORDER).then(o => o && setOrder(o));
  }, []);
  const toggle = (t) => {
    setTypes(curr => {
      const next = curr.includes(t) ? curr.filter(x=>x!==t) : [...curr, t];
      set(STORAGE_KEYS.BARCODE_TYPES,next);
      return next;
    });
  };
  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      accessible accessibilityLabel="Customize settings">
      <Text style={[styles.h1, { color: colors.primary }]}>Personalizar</Text>
      <Text style={styles.p}>Elige tema claro, oscuro o low-light y ajusta OCR, batch y voz.</Text>
      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => {
          setHaptics(!haptics);
          set('haptics', !haptics);
        }}
        style={{marginBottom:16}}
      >
        <Text style={{ color: colors.action }}>{haptics ? 'Desactivar' : 'Activar'} vibraciones</Text>
      </TouchableOpacity>
      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => {
          setPower(!power);
          set(STORAGE_KEYS.POWER_SAVING, !power ? '1' : '0');
        }}
        style={{marginBottom:16}}
      >
        <Text style={{ color: colors.action }}>{power ? 'Desactivar' : 'Activar'} ahorro de energía</Text>
      </TouchableOpacity>
      <TouchableOpacity
        accessibilityRole="button"
        onPress={async () => {
          await remove(STORAGE_KEYS.TIP_SCAN);
          await remove(STORAGE_KEYS.TIP_BATCH);
          await remove(STORAGE_KEYS.TIP_MAP);
        }}
      >
        <Text style={{ color: colors.action }}>Restablecer tips de uso</Text>
      </TouchableOpacity>
      <Text style={[styles.h1,{color:colors.primary,marginTop:20}]}>Orden de pestañas</Text>
      <DraggableFlatList
        data={order}
        onDragEnd={({data}) => { setOrder(data); set(STORAGE_KEYS.TAB_ORDER,data); }}
        keyExtractor={item => item}
        renderItem={({item, drag}) => (
          <TouchableOpacity
            onLongPress={drag}
            style={{padding:8,marginBottom:4,backgroundColor:colors.card}}
          >
            <Text style={{color:colors.text}}>{item}</Text>
          </TouchableOpacity>
        )}
      />
      <Text style={[styles.h1,{color:colors.primary,marginTop:20}]}>Formatos de código</Text>
      {['qr','upc_a','upc_e','aztec','datamatrix','pdf417'].map(key=> (
        <TouchableOpacity key={key} style={{flexDirection:'row',alignItems:'center',marginBottom:8}} onPress={()=>toggle(key)}>
          <View style={{width:24,height:24,marginRight:8,borderWidth:1,borderColor:colors.primary,backgroundColor:types.includes(key)?colors.action:'transparent'}} />
          <Text style={{color:colors.text}}>{key}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

function About() {
  const colors = useColors();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <View style={styles.content}>
        <Text style={[styles.h1, { color: colors.primary }]}>Acerca de</Text>
        <Text style={styles.p}>Versión: {pkg.version}</Text>
        <Text style={styles.p}>Envía comentarios a feedback@scanly.app</Text>
      </View>
    </View>
  );
}

function Sync() {
  const colors = useColors();
  const [status, setStatus] = React.useState('No conectado');
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.h1, { color: colors.primary }]}>Cloud Sync</Text>
        <Text style={styles.p}>Estado: {status}</Text>
        <TouchableOpacity accessibilityRole="button" onPress={() => setStatus('Sincronizado')}>
          <Text style={{ color: colors.action }}>Sync now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Integrations() {
  const colors = useColors();
  const [url, setUrl] = React.useState('');
  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Text style={[styles.h1, { color: colors.primary }]}>Integrations</Text>
      <TextInput value={url} onChangeText={setUrl} placeholder="Webhook URL" placeholderTextColor={colors.text} style={{borderWidth:1,borderColor:colors.primary,color:colors.text,padding:8,marginBottom:10}} />
      <TouchableOpacity accessibilityRole="button" onPress={() => setUrl('')}> 
        <Text style={{ color: colors.action }}>Save</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Profile() {
  const colors = useColors();
  const [name, setName] = React.useState('');
  React.useEffect(() => { getSecure(STORAGE_KEYS.USER_NAME).then(v => v && setName(v)); }, []);
  const save = async () => { await setSecure(STORAGE_KEYS.USER_NAME, name); };
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <View style={styles.content}>
        <Text style={[styles.h1, { color: colors.primary }]}>Perfil</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Nombre"
          placeholderTextColor={colors.text}
          style={{ borderWidth:1, borderColor: colors.primary, color: colors.text, padding:8, marginBottom:10 }}
        />
        <TouchableOpacity onPress={save} accessibilityRole="button">
          <Text style={{ color: colors.action }}>Guardar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const Tab = createMaterialTopTabNavigator();

export default function SettingsScreen() {
  const colors = useColors();
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarIndicatorStyle: { backgroundColor: colors.action },
        tabBarStyle: { backgroundColor: colors.background },
      }}
    >
      <Tab.Screen name="Política" component={Privacy} />
      <Tab.Screen name="FAQ" component={FAQ} />
      <Tab.Screen name="Términos" component={Terms} />
      <Tab.Screen name="Personalizar" component={Customize} />
      <Tab.Screen name="Perfil" component={Profile} />
      <Tab.Screen name="Acerca" component={About} />
      <Tab.Screen name="Sync" component={Sync} />
      <Tab.Screen name="Integraciones" component={Integrations} />
      <Tab.Screen name="Tips" component={require('./TipsScreen').default} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  h1: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  p: { marginBottom: 10, fontSize: 14 },
});

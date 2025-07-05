import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import AppButton from '../components/AppButton';
import { useNavigation } from '@react-navigation/native';

export default function TipsScreen() {
  const nav = useNavigation();
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 10 }}>Gestos</Text>
      <Text style={{ marginBottom: 6 }}>Swipe izquierdo con tres dedos: deshacer último escaneo.</Text>
      <Text style={{ marginBottom: 6 }}>Swipe arriba: abrir galería.</Text>
      <Text style={{ marginBottom: 20 }}>Swipe lateral: cambiar pestaña o cámara.</Text>
      <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 10 }}>Comandos de voz</Text>
      <Text style={{ marginBottom: 6 }}>"Escanear código" abre la cámara.</Text>
      <Text style={{ marginBottom: 6 }}>"Traducir a inglés" abre OCR en modo inglés.</Text>
      <AppButton title="Volver" onPress={() => nav.goBack()} />
    </ScrollView>
  );
}

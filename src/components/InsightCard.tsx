import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function InsightCard({ icon, color, text }) {
  return (
    <View style={[styles.card, { borderColor: color }]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.text, { color }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, padding: 8, marginBottom: 6, borderRadius: 6 },
  icon: { marginRight: 8, fontSize: 16 },
  text: { fontSize: 14 },
});

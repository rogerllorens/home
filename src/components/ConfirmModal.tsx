import React from 'react';
import { Modal, View, Text, Button, StyleSheet } from 'react-native';
import theme from '../utils/theme';
import { useColorScheme } from 'react-native';

export default function ConfirmModal({ visible, message, onConfirm, onCancel }) {
  const scheme = useColorScheme();
  const colors = theme[scheme === 'dark' ? 'lowLight' : 'light'];
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={[styles.box, { backgroundColor: colors.background }]}>
          <Text style={[styles.text, { color: colors.text }]}>{message}</Text>
          <View style={styles.row}>
            <Button title="Cancelar" onPress={onCancel} color={colors.action} />
            <Button title="Confirmar" onPress={onConfirm} color={colors.primary} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#00000080' },
  box: { padding:20, borderRadius:12, width:'80%' },
  text: { marginBottom:10, textAlign:'center' },
  row: { flexDirection:'row', justifyContent:'space-around' }
});

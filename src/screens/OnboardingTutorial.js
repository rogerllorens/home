import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { copilot, walkthroughable, CopilotStep } from 'react-native-copilot';
import AppButton from '../components/AppButton';

const WalkView = walkthroughable(View);

function Tutorial({ start, copilotEvents, onDone }) {
  useEffect(() => {
    copilotEvents.on('stop', onDone);
    start();
  }, []);
  return (
    <View style={styles.container}>
      <CopilotStep text="Toca aquí para escanear" order={1} name="scan">
        <WalkView style={styles.box} />
      </CopilotStep>
      <AppButton title="Saltar" onPress={onDone} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, justifyContent:'center', alignItems:'center' },
  box: { width: 100, height: 100, backgroundColor: '#FF7A00' }
});

export default copilot()(Tutorial);

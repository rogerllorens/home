import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { STORAGE_KEYS, get, set } from './storageService';

export async function signInAnonymously() {
  await auth().signInAnonymously();
}

export async function syncHistory(userId: string, history: any[]) {
  const ref = firestore().collection('history').doc(userId);
  await ref.set({ items: history, updated: Date.now() });
}

export async function loadHistory(userId: string): Promise<any[]> {
  const doc = await firestore().collection('history').doc(userId).get();
  return doc.exists ? doc.data()?.items || [] : [];
}

export async function initSync(userId: string, onUpdate: (items:any[])=>void) {
  firestore()
    .collection('history')
    .doc(userId)
    .onSnapshot(snap => {
      if (snap.exists) onUpdate(snap.data()?.items || []);
    });
}

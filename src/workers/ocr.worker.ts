import { self } from 'react-native-threads';
import Tesseract from 'tesseract.js';

self.onmessage = async (message: { path: string; lang: string }) => {
  const { path, lang } = message;
  try {
    const { data } = await Tesseract.recognize(path, lang);
    self.postMessage({ text: data.text });
  } catch (e) {
    self.postMessage({ text: '' });
  }
};

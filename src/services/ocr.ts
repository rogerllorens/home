/**
 * OCR service using on-device ML Kit with Tesseract fallback.
 */
import { recognizeText } from '@react-native-ml-kit/text-recognition';
import Tesseract from 'tesseract.js';
import { franc } from 'franc';
import Config from 'react-native-config';
import { Thread } from 'react-native-threads';
import { get, set, setSecure } from './storageService';
import { cropImage, rotateImage, adjustImage, sharpenImage, CropRect } from './imageTools';
import singleflight from '../utils/singleflight';
import { startTransaction } from './errorReporting';

export type ProgressCallback = (p: number) => void;

export interface PreprocessOptions {
  crop?: CropRect;
  rotate?: number;
  brightness?: number;
  contrast?: number;
  saturation?: number;
  sharpen?: boolean;
}

export async function preprocessImage(path: string, options: PreprocessOptions): Promise<string> {
  let uri = path;
  if (options.crop) {
    uri = await cropImage(uri, options.crop);
  }
  if (options.rotate) {
    uri = await rotateImage(uri, options.rotate);
  }
  if (options.brightness || options.contrast || options.saturation) {
    uri = await adjustImage(uri, {
      brightness: options.brightness,
      contrast: options.contrast,
      saturation: options.saturation,
    });
  }
  if (options.sharpen) {
    uri = await sharpenImage(uri);
  }
  return uri;
}

export async function imageToText(path: string, onProgress?: ProgressCallback, lang: string = 'eng', opts?: PreprocessOptions): Promise<string> {
  const tx = startTransaction('imageToText');
  const cacheKey = `ocr_${path}_${lang}`;
  return singleflight(cacheKey, async () => {
    const cached = await get<string>(cacheKey);
    if (cached) {
      onProgress && onProgress(1);
      return cached;
    }
    const processed = opts ? await preprocessImage(path, opts) : path;
    try {
      const result = await recognizeText(processed);
      onProgress && onProgress(1);
      await setSecure(cacheKey, result.text);
      tx?.finish();
      return result.text;
    } catch (e) {
      console.warn('ML Kit failed, using Tesseract');
      return new Promise(resolve => {
        try {
          const thread = new Thread('./src/workers/ocr.worker.js');
            thread.onmessage = msg => {
              setSecure(cacheKey, msg.text);
              onProgress && onProgress(1);
              thread.terminate();
              tx?.finish();
              resolve(msg.text);
            };
          thread.postMessage({ path: processed, lang });
        } catch (err) {
          console.error('thread failed', err);
          Tesseract.recognize(processed, lang, {
            logger: m => onProgress && onProgress(m.progress),
          })
            .then(({ data }) => {
              setSecure(cacheKey, data.text);
              tx?.finish();
              resolve(data.text);
            })
            .catch(() => resolve(''));
        }
      });
    }
  });
}

export async function cloudOcr(imageBase64: string): Promise<{text:string,lang?:string}> {
  const key = Config.GOOGLE_VISION_KEY;
  if (!key) return { text: '' };
  try {
    const body = {
      requests: [
        { image: { content: imageBase64 }, features: [{ type: 'TEXT_DETECTION' }] }
      ]
    };
    const res = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const json = await res.json();
    const annotation = json.responses?.[0]?.fullTextAnnotation;
    const lang = annotation?.pages?.[0]?.property?.detectedLanguages?.[0]?.languageCode;
    return { text: annotation?.text || '', lang };
  } catch (e) {
    console.warn('cloud ocr failed', e);
    return { text: '' };
  }
}

export async function smartOcr(path: string, useCloud: boolean, onProgress?: ProgressCallback, lang: string = 'eng'): Promise<string> {
  if (useCloud && Config.OCR_CLOUD_KEY) {
    const base64 = await imageToBase64(path);
    const res = await cloudOcr(base64);
    await setSecure(`ocr_${path}_${lang}`, res.text);
    return res.text;
  }
  return imageToText(path, onProgress, lang);
}

export async function autoOcr(path: string, useCloud: boolean, onProgress?: ProgressCallback): Promise<string> {
  const first = await smartOcr(path, useCloud, p => onProgress && onProgress(p * 0.5));
  const detected = franc(first);
  if (detected && detected !== 'und' && detected !== 'eng') {
    const second = await imageToText(path, p => onProgress && onProgress(0.5 + p * 0.5), detected);
    return second;
  }
  onProgress && onProgress(1);
  return first;
}

async function imageToBase64(uri: string): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

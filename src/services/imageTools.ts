export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AdjustOptions {
  brightness?: number; // -1..1
  contrast?: number;   // 0..2
  saturation?: number; // 0..2
}

/**
 * Crop an image using react-native-photo-manipulator.
 */
export async function cropImage(uri: string, rect: CropRect): Promise<string> {
  try {
    const PhotoManipulator = require('react-native-photo-manipulator');
    return await PhotoManipulator.crop(uri, rect);
  } catch (e) {
    console.warn('cropImage failed', e);
    return uri;
  }
}

/**
 * Rotate an image by the given angle.
 */
export async function rotateImage(uri: string, angle: number): Promise<string> {
  try {
    const PhotoManipulator = require('react-native-photo-manipulator');
    return await PhotoManipulator.rotate(uri, angle);
  } catch (e) {
    console.warn('rotateImage failed', e);
    return uri;
  }
}

/**
 * Adjust brightness/contrast/saturation.
 */
export async function adjustImage(uri: string, opts: AdjustOptions): Promise<string> {
  try {
    const PhotoManipulator = require('react-native-photo-manipulator');
    const operations = [] as any[];
    if (opts.brightness || opts.contrast || opts.saturation) {
      operations.push({
        operation: 'adjust',
        brightness: opts.brightness ?? 0,
        contrast: opts.contrast ?? 1,
        saturation: opts.saturation ?? 1,
      });
    }
    return await PhotoManipulator.batch(uri, operations);
  } catch (e) {
    console.warn('adjustImage failed', e);
    return uri;
  }
}

/**
 * Sharpen an image using PhotoManipulator's blur with negative value.
 */
export async function sharpenImage(uri: string): Promise<string> {
  try {
    const PhotoManipulator = require('react-native-photo-manipulator');
    return await PhotoManipulator.sharpen(uri, 0.5);
  } catch (e) {
    console.warn('sharpenImage failed', e);
    return uri;
  }
}

export async function annotateImage(uri: string, text: string): Promise<string> {
  try {
    const PhotoManipulator = require('react-native-photo-manipulator');
    return await PhotoManipulator.printText(uri, text, {
      position: { x: 10, y: 10 },
      textSize: 24,
      color: '#ff0000',
    });
  } catch (e) {
    console.warn('annotateImage failed', e);
    return uri;
  }
}

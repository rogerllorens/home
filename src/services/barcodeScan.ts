import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';

const reader = new BrowserMultiFormatReader();

export async function decodeImage(uri: string): Promise<string | null> {
  try {
    const result = await reader.decodeFromImage(undefined as any, uri);
    return result.getText();
  } catch (e) {
    if (!(e instanceof NotFoundException)) {
      console.warn('decode error', e);
    }
    return null;
  }
}

/**
 * Attempt to decode damaged or partial barcodes. Currently uses ZXing and
 * falls back to returning null. A future version may apply AI inpainting to
 * reconstruct missing cells.
 */
export async function decodeDamaged(uri: string): Promise<string | null> {
  const result = await decodeImage(uri);
  if (result) return result;
  // TODO: AI inpainting of damaged codes
  return null;
}

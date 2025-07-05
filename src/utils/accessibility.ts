import { AccessibilityInfo } from 'react-native';

let cached: boolean | null = null;
export async function shouldReduceMotion(): Promise<boolean> {
  if (cached === null) {
    try {
      cached = await AccessibilityInfo.isReduceMotionEnabled();
    } catch {
      cached = false;
    }
  }
  return cached;
}

import JailMonkey from 'jail-monkey';

export function isDeviceSecure(): boolean {
  return !JailMonkey.isJailBroken() && !JailMonkey.trustFall();
}

describe('Generate flow', () => {
  it('generates and shares a QR', async () => {
    await device.launchApp({newInstance: true});
    await element(by.id('generate-tab')).tap();
    await element(by.id('generate-input')).typeText('https://example.com');
    await element(by.id('generate-button')).tap();
    await expect(element(by.id('qr-preview'))).toBeVisible();
    await element(by.id('copy-link')).tap();
    await expect(element(by.text('Copied'))).toBeVisible();
  });
});

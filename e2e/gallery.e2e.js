describe('Gallery OCR flow', () => {
  it('scans an image from gallery', async () => {
    await device.launchApp({newInstance: true});
    await element(by.id('gallery-tab')).tap();
    await element(by.id('gallery-pick')).tap();
    await element(by.text('sample')).tap();
    await element(by.id('gallery-ocr')).tap();
    await expect(element(by.id('ocr-progress'))).toBeVisible();
    await waitFor(element(by.id('ocr-text'))).toBeVisible().withTimeout(10000);
  });
});

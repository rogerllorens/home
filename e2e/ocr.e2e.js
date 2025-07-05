describe('OCR flow', () => {
  it('extracts text from image', async () => {
    await device.launchApp({newInstance: true});
    await element(by.id('ocr-tab')).tap();
    await element(by.id('image-picker')).tap();
    // assumes sample image is first in library
    await element(by.text('sample')).tap();
    await expect(element(by.id('ocr-progress'))).toBeVisible();
    await waitFor(element(by.id('ocr-text'))).toBeVisible().withTimeout(10000);
  });
});

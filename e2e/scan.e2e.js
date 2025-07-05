describe('Onboarding and Scan flow', () => {
  it('shows onboarding then goes to scan', async () => {
    await device.launchApp({delete: true});
    await expect(element(by.id('onboard-slide-0'))).toBeVisible();
    await element(by.id('onboard-skip')).tap();
    await expect(element(by.id('scan-screen'))).toBeVisible();
  });
});

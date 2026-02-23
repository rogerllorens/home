<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;

final class I18nScanTest extends TestCase
{
    public function testCoreUiFilesUsePluginTextDomainForTranslations(): void
    {
        $files = [
            __DIR__ . '/../includes/Admin/SettingsPage.php',
            __DIR__ . '/../includes/Checkout/ValidatorService.php',
        ];

        foreach ($files as $file) {
            $content = (string) file_get_contents($file);
            $this->assertStringContainsString('taxid-guard-for-woocommerce', $content, basename($file));
            $this->assertMatchesRegularExpression('/(__(|esc_html__|esc_attr__)\s*\(|_e\s*\()/', $content, basename($file));
        }
    }
}

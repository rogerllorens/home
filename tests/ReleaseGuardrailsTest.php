<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;

final class ReleaseGuardrailsTest extends TestCase
{
    public function testLiteCodeHasNoExampleComUpgradeUrl(): void
    {
        $files = [
            __DIR__ . '/../taxid-guard.php',
            __DIR__ . '/../includes/Admin/SettingsPage.php',
            __DIR__ . '/../includes/Admin/UpgradePage.php',
        ];

        foreach ($files as $file) {
            $content = (string) file_get_contents($file);
            $this->assertStringNotContainsString('example.com', $content, basename($file));
        }
    }

    public function testProFreemiusPlaceholderNotShippedInReleaseZip(): void
    {
        $script = __DIR__ . '/../scripts/build-zips.sh';
        $this->assertFileExists($script);
    }
}

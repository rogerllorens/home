<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/Domain/TaxIdNormalizer.php';
require_once __DIR__ . '/../includes/Domain/TaxIdValidatorES.php';
require_once __DIR__ . '/../includes/Domain/TaxIdValidatorEU.php';

if (!function_exists('__')) {
    function __(string $text, ?string $domain = null): string { return $text; }
}
if (!defined('ABSPATH')) {
    define('ABSPATH', __DIR__);
}

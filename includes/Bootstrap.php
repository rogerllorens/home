<?php
declare(strict_types=1);

namespace TaxID_Guard;

use TaxID_Guard\Admin\AdminDisplay;
use TaxID_Guard\Admin\OrdersListBadge;
use TaxID_Guard\Admin\SettingsPage;
use TaxID_Guard\Admin\UpgradePage;
use TaxID_Guard\Admin\DebugPage;
use TaxID_Guard\Admin\VatRatesPage;
use TaxID_Guard\Admin\SettingsMigrator;
use TaxID_Guard\Checkout\Validator;
use TaxID_Guard\Checkout\LocationEvidence;
use TaxID_Guard\Checkout\VatExemptionManager;
use TaxID_Guard\Classic\ClassicFields;
use TaxID_Guard\Classic\AccountVatFields;
use TaxID_Guard\Integrations\CheckoutFields;
use TaxID_Guard\Privacy\PersonalDataExportErase;
use TaxID_Guard\Utils\Logger;

defined('ABSPATH') || exit;

final class Bootstrap
{
    private static ?self $instance = null;
    private ?Logger $logger = null;

    public static function instance(): self
    {
        if (! self::$instance) {
            self::$instance = new self();
            self::$instance->init();
        }

        return self::$instance;
    }

    public static function get_logger(): ?Logger
    {
        return self::instance()->logger;
    }

    private function init(): void
    {
        if (get_option('tg_debug', 'no') === 'yes') {
            $this->logger = new Logger();
        }

        load_plugin_textdomain('taxid-guard-for-woocommerce', false, dirname(TG_PLUGIN_BASENAME) . '/languages');

        new SettingsPage();
        new UpgradePage();
        new AdminDisplay();
        new CheckoutFields();
        new ClassicFields();
        new OrdersListBadge();
        new PersonalDataExportErase();
        new DebugPage();
        new VatRatesPage();

        new Validator();
        new VatExemptionManager();
        new LocationEvidence();
        new AccountVatFields();

        add_action('admin_init', [$this, 'maybe_migrate_settings']);
        add_action('wp_enqueue_scripts', [$this, 'enqueue_classic_assets']);
        add_filter('plugin_action_links_' . TG_PLUGIN_BASENAME, [$this, 'plugin_action_links']);
        add_filter('plugin_row_meta', [$this, 'plugin_row_meta'], 10, 2);
    }

    private function is_classic_checkout(): bool
    {
        if (! function_exists('is_checkout') || ! is_checkout()) {
            return false;
        }
        if (defined('REST_REQUEST') && REST_REQUEST) {
            return false;
        }
        if (function_exists('wc_current_theme_is_fse_theme') && wc_current_theme_is_fse_theme()) {
            return false;
        }

        $post = get_post();
        if ($post instanceof \WP_Post && function_exists('has_block') && has_block('woocommerce/checkout', $post)) {
            return false;
        }
        if ($post instanceof \WP_Post && has_shortcode($post->post_content, 'woocommerce_checkout')) {
            return true;
        }

        return true;
    }

    public function enqueue_classic_assets(): void
    {
        if (! $this->is_classic_checkout()) {
            return;
        }

        $show_company = get_option('tg_show_company_checkbox', 'yes') === 'yes';
        $show_taxid = get_option('tg_show_taxid_field', 'always');
        if (! $show_company && $show_taxid !== 'always') {
            return;
        }

        wp_enqueue_script('tg-checkout-classic', TG_PLUGIN_URL . 'assets/js/checkout.js', ['jquery'], TG_VERSION, true);
        wp_localize_script('tg-checkout-classic', 'tgCheckout', [
            'showCompany' => $show_company,
            'showTaxIdField' => $show_taxid,
            'requireForCompany' => get_option('tg_company_requires_taxid', 'yes') === 'yes',
            'defaultLabel' => (string) get_option('tg_taxid_label', __('Tax Identifier', 'taxid-guard-for-woocommerce')),
            'defaultHelp' => (string) get_option('tg_taxid_help', __('Provide your Tax ID if applicable.', 'taxid-guard-for-woocommerce')),
            'labelByCountry' => (array) get_option('tg_label_by_country', []),
            'helpByCountry' => (array) get_option('tg_help_by_country', []),
            'vatPrefixAuto' => get_option('tg_vat_prefix_auto', 'no') === 'yes',
            'showValidationProgress' => get_option('tg_show_validation_progress', 'yes') === 'yes',
            'i18n' => [
                'hintCompany' => __('Tax ID is required for company purchases.', 'taxid-guard-for-woocommerce'),
                'hintIndividual' => __('Only required if you are a company.', 'taxid-guard-for-woocommerce'),
                'hintGeneric' => __('Provide your Tax ID if applicable.', 'taxid-guard-for-woocommerce'),
                'hintEnableCompany' => __('Enable “I am a company” to enter VAT.', 'taxid-guard-for-woocommerce'),
                'warnFormat' => (string) get_option('tg_invalid_message', __('Tax ID format looks unusual. Please double-check.', 'taxid-guard-for-woocommerce')),
                'looksGood' => __('Format looks good.', 'taxid-guard-for-woocommerce'),
                'looksWrongEs' => __('Unrecognized format for Spain (NIF/CIF/NIE).', 'taxid-guard-for-woocommerce'),
                'looksGoodEs' => __('Looks like a valid Spanish tax ID format.', 'taxid-guard-for-woocommerce'),
                'ifIndividual' => __('If you are an individual, uncheck “I am a company”.', 'taxid-guard-for-woocommerce'),
                'normalizedAs' => __('We will store it as: %s', 'taxid-guard-for-woocommerce'),
                'progressMessage' => (string) get_option('tg_progress_message', __('Validating VAT...', 'taxid-guard-for-woocommerce')),
                'autoPrefixApplied' => __('Country prefix will be applied automatically.', 'taxid-guard-for-woocommerce'),
            ],
        ]);
        wp_enqueue_style('tg-checkout-classic', TG_PLUGIN_URL . 'assets/css/checkout.css', [], TG_VERSION);
    }


    public function debug_checkout_context(): string
    {
        if (! function_exists('is_checkout') || ! is_checkout()) {
            return 'not_checkout';
        }
        if (defined('REST_REQUEST') && REST_REQUEST) {
            return 'store_api_rest';
        }
        if (function_exists('wc_current_theme_is_fse_theme') && wc_current_theme_is_fse_theme()) {
            return 'fse_blocks';
        }
        $post = get_post();
        if ($post instanceof \WP_Post && function_exists('has_block') && has_block('woocommerce/checkout', $post)) {
            return 'checkout_block';
        }
        if ($post instanceof \WP_Post && has_shortcode($post->post_content, 'woocommerce_checkout')) {
            return 'classic_shortcode';
        }
        return 'classic_fallback';
    }

    public function maybe_migrate_settings(): void
    {
        if (! is_admin() || ! current_user_can('manage_woocommerce')) {
            return;
        }

        SettingsMigrator::run();
    }

    public function plugin_action_links(array $links): array
    {
        $url = (string) apply_filters('tg_taxid_guard_upgrade_url', TG_UPGRADE_URL);
        $links[] = '<a href="' . esc_url($url) . '" target="_blank" rel="noopener">' . esc_html__('Get Pro', 'taxid-guard-for-woocommerce') . '</a>';
        return $links;
    }

    public function plugin_row_meta(array $links, string $file): array
    {
        if ($file !== TG_PLUGIN_BASENAME) {
            return $links;
        }

        $url = (string) apply_filters('tg_taxid_guard_upgrade_url', TG_UPGRADE_URL);
        $links[] = '<a href="' . esc_url($url) . '" target="_blank" rel="noopener">' . esc_html__('TaxID Guard Pro', 'taxid-guard-for-woocommerce') . '</a>';
        return $links;
    }

}

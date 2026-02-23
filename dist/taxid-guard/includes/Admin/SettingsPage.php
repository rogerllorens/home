<?php
declare(strict_types=1);

namespace TaxID_Guard\Admin;

defined('ABSPATH') || exit;

class SettingsPage
{
    public function __construct()
    {
        add_action('admin_init', [$this, 'register_settings']);
        add_action('admin_init', [$this, 'maybe_run_upgrade_routine']);
        add_action('admin_menu', [$this, 'add_settings_page']);
        add_action('admin_post_tg_validation_tester', [$this, 'handle_validation_tester']);
        add_action('admin_post_tg_apply_preset', [$this, 'handle_apply_preset']);
        add_action('admin_post_tg_export_settings', [$this, 'handle_export_settings']);
        add_action('admin_post_tg_import_settings', [$this, 'handle_import_settings']);
        add_action('admin_post_tg_clear_vies_cache', [$this, 'handle_clear_vies_cache']);
    }

    public static function defaults(): array
    {
        return [
            // General / Lite
            'tg_enable' => 'yes',
            'tg_mode' => 'validate',
            'tg_show_company_checkbox' => 'yes',
            'tg_show_taxid_field' => 'always',
            'tg_company_requires_taxid' => 'yes',
            'tg_save_taxid_profile' => 'no',
            'tg_show_in_admin' => 'yes',
            'tg_email_admin' => 'yes',
            'tg_debug' => 'no',
            'tg_mask_admin_taxid' => 'no',
            'tg_taxid_visible_roles' => [],
            'tg_vat_exemption_mode' => 'off',
            'tg_collect_location_evidence' => 'yes',
            'tg_digital_goods_mode' => 'auto_detect_virtual_only',
            'tg_collect_vat_on_signup' => 'no',
            'tg_show_validation_progress' => 'yes',
            'tg_progress_message' => __('Validating VAT...', 'taxid-guard-for-woocommerce'),
            'tg_invalid_message' => __('VAT format looks invalid for the selected country.', 'taxid-guard-for-woocommerce'),
            'tg_required_message' => __('Please enter your VAT / Tax ID.', 'taxid-guard-for-woocommerce'),
            'tg_vies_unavailable_message' => __('VIES validation is available in Pro.', 'taxid-guard-for-woocommerce'),

            // Validation
            'tg_validate_es' => 'yes',
            'tg_validate_eu_vat' => 'yes',
            'tg_vat_prefix_auto' => 'no',
            'tg_required_countries' => [],

            // Country customization
            'tg_taxid_label' => __('Tax Identifier (NIF/CIF/NIE/VAT)', 'taxid-guard-for-woocommerce'),
            'tg_taxid_help' => __('If you purchase as a company, we need your tax identifier.', 'taxid-guard-for-woocommerce'),
            'tg_label_by_country' => [],
            'tg_help_by_country' => [],

        ];
    }

    public static function get(string $key)
    {
        $defaults = self::defaults();
        return get_option($key, $defaults[$key] ?? null);
    }

    public function add_settings_page(): void
    {
        add_submenu_page(
            'woocommerce',
            __('TaxID Guard Settings', 'taxid-guard-for-woocommerce'),
            __('TaxID Guard', 'taxid-guard-for-woocommerce'),
            'manage_woocommerce',
            'tg_taxid_guard',
            [$this, 'render_settings_page']
        );
    }

    public function register_settings(): void
    {
        $group = 'tg_taxid_guard';

        // Lite
        register_setting($group, 'tg_enable', ['sanitize_callback' => [$this, 'sanitize_yes_no']]);
        register_setting($group, 'tg_mode', ['sanitize_callback' => fn($v) => $this->sanitize_select($v, ['collect', 'validate'], 'validate')]);
        register_setting($group, 'tg_show_company_checkbox', ['sanitize_callback' => [$this, 'sanitize_yes_no']]);
        register_setting($group, 'tg_show_taxid_field', ['sanitize_callback' => fn($v) => $this->sanitize_select($v, ['always', 'company', 'no'], 'always')]);
        register_setting($group, 'tg_company_requires_taxid', ['sanitize_callback' => [$this, 'sanitize_yes_no']]);
        register_setting($group, 'tg_save_taxid_profile', ['sanitize_callback' => [$this, 'sanitize_yes_no']]);
        register_setting($group, 'tg_show_in_admin', ['sanitize_callback' => [$this, 'sanitize_yes_no']]);
        register_setting($group, 'tg_email_admin', ['sanitize_callback' => [$this, 'sanitize_yes_no']]);
        register_setting($group, 'tg_debug', ['sanitize_callback' => [$this, 'sanitize_yes_no']]);
        register_setting($group, 'tg_mask_admin_taxid', ['sanitize_callback' => [$this, 'sanitize_yes_no']]);
        register_setting($group, 'tg_taxid_visible_roles', ['sanitize_callback' => [$this, 'sanitize_slug_list']]);
        register_setting($group, 'tg_vat_exemption_mode', ['sanitize_callback' => fn($v) => $this->sanitize_select($v, ['off', 'exempt_when_valid_outside_base_country', 'exempt_when_valid_anywhere', 'preserve_vat_in_base_country_only'], 'off')]);
        register_setting($group, 'tg_collect_location_evidence', ['sanitize_callback' => [$this, 'sanitize_yes_no']]);
        register_setting($group, 'tg_digital_goods_mode', ['sanitize_callback' => fn($v) => $this->sanitize_select($v, ['auto_detect_virtual_only', 'always_treat_as_digital', 'disabled'], 'auto_detect_virtual_only')]);
        register_setting($group, 'tg_collect_vat_on_signup', ['sanitize_callback' => [$this, 'sanitize_yes_no']]);
        register_setting($group, 'tg_show_validation_progress', ['sanitize_callback' => [$this, 'sanitize_yes_no']]);
        register_setting($group, 'tg_progress_message', ['sanitize_callback' => 'sanitize_text_field']);
        register_setting($group, 'tg_invalid_message', ['sanitize_callback' => 'sanitize_text_field']);
        register_setting($group, 'tg_required_message', ['sanitize_callback' => 'sanitize_text_field']);
        register_setting($group, 'tg_vies_unavailable_message', ['sanitize_callback' => 'sanitize_text_field']);

        register_setting($group, 'tg_validate_es', ['sanitize_callback' => [$this, 'sanitize_yes_no']]);
        register_setting($group, 'tg_validate_eu_vat', ['sanitize_callback' => [$this, 'sanitize_yes_no']]);
        register_setting($group, 'tg_vat_prefix_auto', ['sanitize_callback' => [$this, 'sanitize_yes_no']]);
        register_setting($group, 'tg_required_countries', ['sanitize_callback' => [$this, 'sanitize_iso2_list']]);

        register_setting($group, 'tg_taxid_label', ['sanitize_callback' => 'sanitize_text_field']);
        register_setting($group, 'tg_taxid_help', ['sanitize_callback' => 'sanitize_textarea_field']);
        register_setting($group, 'tg_label_by_country', ['sanitize_callback' => [$this, 'sanitize_assoc_map']]);
        register_setting($group, 'tg_help_by_country', ['sanitize_callback' => [$this, 'sanitize_assoc_map_help']]);

        // Pro-gated
    }

    public function sanitize_yes_no($v): string
    {
        return $v === 'yes' ? 'yes' : 'no';
    }

    public function sanitize_select($v, array $allowed, $default)
    {
        return in_array($v, $allowed, true) ? $v : $default;
    }

    public function sanitize_int_range($v, int $min, int $max, int $default): int
    {
        if (! is_numeric($v)) {
            return $default;
        }
        return max($min, min((int) $v, $max));
    }

    public function sanitize_float($v, float $min, float $max, float $default): float
    {
        $v = str_replace(',', '.', (string) $v);
        if (! is_numeric($v)) {
            return $default;
        }
        $f = (float) $v;
        return max($min, min($f, $max));
    }

    public function sanitize_iso2_list($v): array
    {
        $items = $this->normalize_list_input($v);
        $out = [];
        foreach ($items as $item) {
            $key = strtoupper(sanitize_text_field((string) $item));
            if (preg_match('/^[A-Z]{2}$/', $key)) {
                $out[] = $key;
            }
        }
        return array_values(array_unique($out));
    }

    public function sanitize_slug_list($v): array
    {
        $items = $this->normalize_list_input($v);
        $out = [];
        foreach ($items as $item) {
            $key = sanitize_text_field((string) $item);
            if ($key !== '') {
                $out[] = $key;
            }
        }
        return array_values(array_unique($out));
    }

    private function normalize_list_input($v): array
    {
        $v = maybe_unserialize($v);
        if (is_string($v)) {
            $v = trim($v) === '' ? [] : preg_split('/\s*,\s*/', $v);
        }
        if (! is_array($v)) {
            return [];
        }
        return array_map(static fn($item) => trim((string) $item), $v);
    }

    public function sanitize_assoc_map($v): array
    {
        $v = maybe_unserialize($v);
        $result = [];

        if (is_array($v) && array_keys($v) !== range(0, count($v) - 1)) {
            foreach ($v as $k => $value) {
                $key = strtoupper(sanitize_text_field((string) $k));
                $val = sanitize_text_field((string) $value);
                if (preg_match('/^[A-Z]{2}$/', $key) && $val !== '') {
                    $result[$key] = $val;
                }
            }
            return $result;
        }

        $text = is_array($v) ? implode("\n", array_map('strval', $v)) : (string) $v;
        foreach (preg_split('/\r\n|\r|\n/', $text) ?: [] as $line) {
            $line = trim($line);
            if ($line === '' || strpos($line, '=') === false) {
                continue;
            }
            [$raw_key, $raw_val] = array_map('trim', explode('=', $line, 2));
            $key = strtoupper(sanitize_text_field($raw_key));
            $val = sanitize_text_field($raw_val);
            if (preg_match('/^[A-Z]{2}$/', $key) && $val !== '') {
                $result[$key] = $val;
            }
        }

        return $result;
    }

    public function sanitize_assoc_map_help($v): array
    {
        $map = $this->sanitize_assoc_map($v);
        foreach ($map as $k => $val) {
            $map[$k] = str_replace('\\n', "\n", sanitize_textarea_field($val));
        }
        return $map;
    }
    private function maybe_run_upgrade_routine(): void
    {
        $version = get_option('tg_settings_schema_version', '0');
        if (version_compare($version, '1.0.0', '>=')) {
            return;
        }

        // Migrate legacy values
        $show_field = get_option('tg_show_taxid_field', 'always');
        if ($show_field === 'yes') {
            update_option('tg_show_taxid_field', 'always');
        } elseif ($show_field === 'no') {
            update_option('tg_show_taxid_field', 'no');
        }

        update_option('tg_settings_schema_version', '1.0.0');
    }

    public function render_settings_page(): void
    {
        if (! current_user_can('manage_woocommerce')) {
            wp_die(esc_html__('Insufficient permissions.', 'taxid-guard-for-woocommerce'));
        }

        $is_pro = false;
        $upgrade_url = 'https://example.com/taxid-guard-pro';

        $label_map = $this->map_to_textarea(self::get('tg_label_by_country'));
        $help_map = $this->map_to_textarea(self::get('tg_help_by_country'));

        echo '<div class="wrap"><h1>' . esc_html__('TaxID Guard Settings', 'taxid-guard-for-woocommerce') . '</h1>';

        $this->render_section_diagnostics($is_pro);
        $this->render_section_presets();

        echo '<form method="post" action="options.php">';
        settings_fields('tg_taxid_guard');

        $this->render_section_general();
        $this->render_section_checkout();
        $this->render_section_validation();
        $this->render_section_countries($label_map, $help_map);

        $extraSections = apply_filters('tg_taxid_guard_settings_sections', []);
        if (is_array($extraSections)) {
            foreach ($extraSections as $section) {
                if (is_callable($section)) {
                    call_user_func($section, $this);
                }
            }
        }

        submit_button(__('Save changes', 'taxid-guard-for-woocommerce'));
        echo '</form>';

        $this->render_section_pro($is_pro, $upgrade_url);
        echo '</div>';
    }

    private function render_section_general(): void
    {
        echo '<h2>' . esc_html__('General', 'taxid-guard-for-woocommerce') . '</h2><table class="form-table">';
        $this->checkbox_row('tg_enable', __('Enable plugin', 'taxid-guard-for-woocommerce'), __('Master on/off switch.', 'taxid-guard-for-woocommerce'));
        $this->select_row('tg_mode', __('Mode', 'taxid-guard-for-woocommerce'), ['validate' => __('Validate (block)', 'taxid-guard-for-woocommerce'), 'collect' => __('Collect (no block)', 'taxid-guard-for-woocommerce')], __('Validation behavior at checkout.', 'taxid-guard-for-woocommerce'));
        $this->checkbox_row('tg_debug', __('Debug logging', 'taxid-guard-for-woocommerce'), __('Write debug info to WooCommerce logs when enabled.', 'taxid-guard-for-woocommerce'));
        echo '</table>';
    }

    private function render_section_presets(): void
    {
        echo '<h2>' . esc_html__('Quick Presets', 'taxid-guard-for-woocommerce') . '</h2>';
        echo '<p class="description">' . esc_html__('Apply a recommended configuration profile to speed up setup.', 'taxid-guard-for-woocommerce') . '</p>';
        echo '<form method="post" action="' . esc_url(admin_url('admin-post.php')) . '">';
        wp_nonce_field('tg_apply_preset', 'tg_apply_preset_nonce');
        echo '<input type="hidden" name="action" value="tg_apply_preset" />';
        echo '<p>';
        echo '<button class="button" type="submit" name="preset" value="b2b_eu">' . esc_html__('Preset B2B EU', 'taxid-guard-for-woocommerce') . '</button> ';
        echo '<button class="button" type="submit" name="preset" value="permissive">' . esc_html__('Preset Permissive', 'taxid-guard-for-woocommerce') . '</button> ';
        echo '<button class="button" type="submit" name="preset" value="es_only">' . esc_html__('Preset ES Only', 'taxid-guard-for-woocommerce') . '</button>';
        echo '</p>';
        echo '</form>';
    }

    private function render_section_checkout(): void
    {
        echo '<h2>' . esc_html__('Checkout', 'taxid-guard-for-woocommerce') . '</h2><table class="form-table">';
        $this->checkbox_row('tg_show_company_checkbox', __('Show “I am a company” checkbox', 'taxid-guard-for-woocommerce'), '');
        $this->select_row('tg_show_taxid_field', __('Show Tax ID field', 'taxid-guard-for-woocommerce'), ['always' => __('Always', 'taxid-guard-for-woocommerce'), 'company' => __('Only for company', 'taxid-guard-for-woocommerce'), 'no' => __('No', 'taxid-guard-for-woocommerce')], '');
        $this->checkbox_row('tg_company_requires_taxid', __('Tax ID required if company', 'taxid-guard-for-woocommerce'), '');
        $this->checkbox_row('tg_save_taxid_profile', __('Save to customer profile', 'taxid-guard-for-woocommerce'), '');
        $this->checkbox_row('tg_show_in_admin', __('Show in admin order', 'taxid-guard-for-woocommerce'), '');
        $this->checkbox_row('tg_email_admin', __('Show in admin emails', 'taxid-guard-for-woocommerce'), '');
        $this->checkbox_row('tg_mask_admin_taxid', __('Mask Tax ID in admin and admin emails', 'taxid-guard-for-woocommerce'), '');
        echo '<tr><th>' . esc_html__('Roles allowed to view full Tax ID (CSV)', 'taxid-guard-for-woocommerce') . '</th><td><input class="regular-text" type="text" name="tg_taxid_visible_roles" value="' . esc_attr(implode(',', (array) self::get('tg_taxid_visible_roles'))) . '" placeholder="administrator,shop_manager" /><p class="description">' . esc_html__('Leave empty to allow all admin roles with access to this page.', 'taxid-guard-for-woocommerce') . '</p></td></tr>';
        $this->select_row('tg_vat_exemption_mode', __('VAT exemption mode', 'taxid-guard-for-woocommerce'), ['off' => __('Off', 'taxid-guard-for-woocommerce'), 'exempt_when_valid_outside_base_country' => __('Exempt when valid outside base country', 'taxid-guard-for-woocommerce'), 'exempt_when_valid_anywhere' => __('Exempt when valid anywhere', 'taxid-guard-for-woocommerce'), 'preserve_vat_in_base_country_only' => __('Preserve VAT in base country only', 'taxid-guard-for-woocommerce')], '');
        $this->checkbox_row('tg_collect_location_evidence', __('Collect location evidence', 'taxid-guard-for-woocommerce'), '');
        $this->select_row('tg_digital_goods_mode', __('Digital goods mode', 'taxid-guard-for-woocommerce'), ['auto_detect_virtual_only' => __('Auto detect virtual-only carts', 'taxid-guard-for-woocommerce'), 'always_treat_as_digital' => __('Always treat as digital', 'taxid-guard-for-woocommerce'), 'disabled' => __('Disabled', 'taxid-guard-for-woocommerce')], '');
        $this->checkbox_row('tg_collect_vat_on_signup', __('Collect VAT on signup/account', 'taxid-guard-for-woocommerce'), '');
        echo '</table>';
    }

    private function render_section_validation(): void
    {
        echo '<h2>' . esc_html__('Validation', 'taxid-guard-for-woocommerce') . '</h2><table class="form-table">';
        $this->checkbox_row('tg_validate_es', __('Validate ES (NIF/NIE/CIF)', 'taxid-guard-for-woocommerce'), '');
        $this->checkbox_row('tg_validate_eu_vat', __('Validate EU VAT pattern', 'taxid-guard-for-woocommerce'), '');
        $this->checkbox_row('tg_vat_prefix_auto', __('Auto prepend VAT country prefix', 'taxid-guard-for-woocommerce'), '');
        $this->checkbox_row('tg_show_validation_progress', __('Show validation progress text', 'taxid-guard-for-woocommerce'), '');
        echo '<tr><th>' . esc_html__('Progress message', 'taxid-guard-for-woocommerce') . '</th><td><input class="regular-text" type="text" name="tg_progress_message" value="' . esc_attr((string) self::get('tg_progress_message')) . '" /></td></tr>';
        echo '<tr><th>' . esc_html__('Invalid message', 'taxid-guard-for-woocommerce') . '</th><td><input class="regular-text" type="text" name="tg_invalid_message" value="' . esc_attr((string) self::get('tg_invalid_message')) . '" /></td></tr>';
        echo '<tr><th>' . esc_html__('Required message', 'taxid-guard-for-woocommerce') . '</th><td><input class="regular-text" type="text" name="tg_required_message" value="' . esc_attr((string) self::get('tg_required_message')) . '" /></td></tr>';
        echo '<tr><th>' . esc_html__('VIES unavailable message', 'taxid-guard-for-woocommerce') . '</th><td><input class="regular-text" type="text" name="tg_vies_unavailable_message" value="' . esc_attr((string) self::get('tg_vies_unavailable_message')) . '" /></td></tr>';
        echo '<tr><th>' . esc_html__('Required countries (ISO2 CSV)', 'taxid-guard-for-woocommerce') . '</th><td><input class="regular-text" type="text" name="tg_required_countries" value="' . esc_attr(implode(',', (array) self::get('tg_required_countries'))) . '" placeholder="ES,IT,DE" /></td></tr>';
        echo '</table>';
    }

    private function render_section_countries(string $label_map, string $help_map): void
    {
        echo '<h2>' . esc_html__('Countries', 'taxid-guard-for-woocommerce') . '</h2><table class="form-table">';
        echo '<tr><th>' . esc_html__('Default label', 'taxid-guard-for-woocommerce') . '</th><td><input class="regular-text" type="text" name="tg_taxid_label" value="' . esc_attr((string) self::get('tg_taxid_label')) . '" /></td></tr>';
        echo '<tr><th>' . esc_html__('Default help', 'taxid-guard-for-woocommerce') . '</th><td><textarea class="large-text" rows="2" name="tg_taxid_help">' . esc_textarea((string) self::get('tg_taxid_help')) . '</textarea></td></tr>';
        echo '<tr><th>' . esc_html__('label_by_country', 'taxid-guard-for-woocommerce') . '</th><td><textarea class="large-text code" rows="6" name="tg_label_by_country" placeholder="ES=NIF/CIF\nIT=Partita IVA">' . esc_textarea($label_map) . '</textarea><p class="description">' . esc_html__('ISO2=Label per line.', 'taxid-guard-for-woocommerce') . '</p></td></tr>';
        echo '<tr><th>' . esc_html__('help_by_country', 'taxid-guard-for-woocommerce') . '</th><td><textarea class="large-text code" rows="6" name="tg_help_by_country" placeholder="ES=Introduce tu NIF/CIF\nIT=Inserisci partita IVA">' . esc_textarea($help_map) . '</textarea><p class="description">' . esc_html__('ISO2=Help per line. Use \\n for line break.', 'taxid-guard-for-woocommerce') . '</p></td></tr>';
        echo '</table>';
    }

    private function render_section_diagnostics(bool $is_pro): void
    {
        $checkoutContext = class_exists('TaxID_Guard\Bootstrap') ? \TaxID_Guard\Bootstrap::instance()->debug_checkout_context() : 'unknown';
        $country = '';
        if (function_exists('WC') && WC()->customer) {
            $country = (string) (WC()->customer->get_billing_country() ?: WC()->customer->get_shipping_country());
        }

        $viesActive = __('Pro plugin required', 'taxid-guard-for-woocommerce');
        $soapAvailable = class_exists('\SoapClient') ? __('Yes', 'taxid-guard-for-woocommerce') : __('No', 'taxid-guard-for-woocommerce');
        $viesCircuit = __('Closed', 'taxid-guard-for-woocommerce');

        $summaryRows = [
            __('Checkout detection', 'taxid-guard-for-woocommerce') => $checkoutContext,
            __('Mode', 'taxid-guard-for-woocommerce') => (string) self::get('tg_mode'),
            __('Detected country', 'taxid-guard-for-woocommerce') => $country !== '' ? $country : __('N/A', 'taxid-guard-for-woocommerce'),
            __('Pro active', 'taxid-guard-for-woocommerce') => $is_pro ? __('Yes', 'taxid-guard-for-woocommerce') : __('No', 'taxid-guard-for-woocommerce'),
            __('VIES enabled', 'taxid-guard-for-woocommerce') => $viesActive,
            __('SOAP available', 'taxid-guard-for-woocommerce') => $soapAvailable,
            __('VIES circuit breaker', 'taxid-guard-for-woocommerce') => $viesCircuit,
        ];

        echo '<h2>' . esc_html__('Status / Diagnostics', 'taxid-guard-for-woocommerce') . '</h2><table class="form-table">';
        foreach ($summaryRows as $label => $value) {
            echo '<tr><th>' . esc_html((string) $label) . '</th><td>' . esc_html((string) $value) . '</td></tr>';
        }
        echo '<tr><th>' . esc_html__('Support summary', 'taxid-guard-for-woocommerce') . '</th><td>';
        $summaryText = [];
        foreach ($summaryRows as $label => $value) {
            $summaryText[] = $label . ': ' . $value;
        }
        echo '<textarea id="tg-diagnostics-summary" class="large-text code" rows="6" readonly>' . esc_textarea(implode("
", $summaryText)) . '</textarea>';
        echo '<p><button type="button" class="button" id="tg-copy-diagnostics">' . esc_html__('Copy diagnostics', 'taxid-guard-for-woocommerce') . '</button></p>';
        echo '</td></tr>';
        echo '<tr><th>' . esc_html__('Support tools', 'taxid-guard-for-woocommerce') . '</th><td>';
        echo '<form method="post" action="' . esc_url(admin_url('admin-post.php')) . '" style="display:inline-block;margin-right:8px;">';
        wp_nonce_field('tg_export_settings', 'tg_export_settings_nonce');
        echo '<input type="hidden" name="action" value="tg_export_settings" />';
        echo '<button type="submit" class="button">' . esc_html__('Export settings (JSON)', 'taxid-guard-for-woocommerce') . '</button>';
        echo '</form>';
        echo '<form method="post" action="' . esc_url(admin_url('admin-post.php')) . '" style="display:inline-block;margin-right:8px;">';
        wp_nonce_field('tg_clear_vies_cache', 'tg_clear_vies_cache_nonce');
        echo '<input type="hidden" name="action" value="tg_clear_vies_cache" />';
        echo '<button type="submit" class="button">' . esc_html__('Clear VIES cache', 'taxid-guard-for-woocommerce') . '</button>';
        echo '</form>';
        echo '<form method="post" action="' . esc_url(admin_url('admin-post.php')) . '" enctype="multipart/form-data" style="display:inline-block;">';
        wp_nonce_field('tg_import_settings', 'tg_import_settings_nonce');
        echo '<input type="hidden" name="action" value="tg_import_settings" />';
        echo '<input type="file" name="tg_settings_json" accept="application/json" /> ';
        echo '<button type="submit" class="button">' . esc_html__('Import settings', 'taxid-guard-for-woocommerce') . '</button>';
        echo '</form>';
        echo '</td></tr>';
        echo '</table>';

        $this->render_validation_tester($is_pro);

        echo '<script>document.addEventListener("DOMContentLoaded",function(){var b=document.getElementById("tg-copy-diagnostics"),t=document.getElementById("tg-diagnostics-summary");if(!b||!t){return;}b.addEventListener("click",function(){t.select();document.execCommand("copy");});});</script>';
    }

    private function render_validation_tester(bool $is_pro): void
    {
        $resultKey = 'tg_validation_tester_result_' . get_current_user_id();
        $result = get_transient($resultKey);
        if ($result !== false) {
            delete_transient($resultKey);
        }

        echo '<h2>' . esc_html__('Validation Tester', 'taxid-guard-for-woocommerce') . '</h2>';
        echo '<p class="description">' . esc_html__('Run a test through the same validation pipeline used in checkout.', 'taxid-guard-for-woocommerce') . '</p>';
        echo '<form method="post" action="' . esc_url(admin_url('admin-post.php')) . '">';
        wp_nonce_field('tg_validation_tester', 'tg_validation_tester_nonce');
        echo '<input type="hidden" name="action" value="tg_validation_tester" />';
        echo '<table class="form-table">';
        echo '<tr><th>' . esc_html__('VIES requirements', 'taxid-guard-for-woocommerce') . '</th><td><p class="description">' . esc_html__('VIES checks require the PHP SOAP extension on your server.', 'taxid-guard-for-woocommerce') . '</p></td></tr>';
        echo '<tr><th>' . esc_html__('Country', 'taxid-guard-for-woocommerce') . '</th><td><select name="country">';
        $countries = ['' => __('Select', 'taxid-guard-for-woocommerce'), 'ES' => 'ES', 'DE' => 'DE', 'FR' => 'FR', 'IT' => 'IT', 'NL' => 'NL', 'PL' => 'PL', 'BE' => 'BE', 'PT' => 'PT', 'US' => 'US'];
        foreach ($countries as $value => $label) {
            echo '<option value="' . esc_attr($value) . '">' . esc_html($label) . '</option>';
        }
        echo '</select></td></tr>';
        echo '<tr><th>' . esc_html__('I am a company', 'taxid-guard-for-woocommerce') . '</th><td><label><input type="checkbox" name="is_company" value="1" /> ' . esc_html__('Yes', 'taxid-guard-for-woocommerce') . '</label></td></tr>';
        echo '<tr><th>' . esc_html__('Tax ID', 'taxid-guard-for-woocommerce') . '</th><td><input class="regular-text" type="text" name="tax_id" /></td></tr>';
        echo '</table>';
        submit_button(__('Test validation', 'taxid-guard-for-woocommerce'));
        echo '</form>';

        if (is_array($result)) {
            echo '<h3>' . esc_html__('Last test result', 'taxid-guard-for-woocommerce') . '</h3>';
            echo '<pre>' . esc_html(wp_json_encode($result, JSON_PRETTY_PRINT)) . '</pre>';
        }
    }

    public function handle_validation_tester(): void
    {
        if (! current_user_can('manage_woocommerce')) {
            wp_die(esc_html__('Insufficient permissions.', 'taxid-guard-for-woocommerce'));
        }

        check_admin_referer('tg_validation_tester', 'tg_validation_tester_nonce');

        $country = strtoupper(sanitize_text_field((string) wp_unslash($_POST['country'] ?? '')));
        $taxId = sanitize_text_field((string) wp_unslash($_POST['tax_id'] ?? ''));
        $isCompany = isset($_POST['is_company']) && $_POST['is_company'] === '1';
        $runVies = false;
        $validator = new \TaxID_Guard\Checkout\ValidatorService();

        $input = new \TaxID_Guard\ValueObjects\TaxIdInput($isCompany, \TaxID_Guard\Domain\TaxIdNormalizer::normalize($taxId), $country);
        $result = $validator->validate($input);

        $payload = [
            'ok' => $result->ok,
            'code' => $result->code,
            'status' => $result->status,
            'method' => $result->method,
            'message' => $result->message,
            'is_company' => $isCompany,
            'country' => $country,
            'tax_id' => $input->taxId,
            'vies_ran' => $runVies,
        ];

        set_transient('tg_validation_tester_result_' . get_current_user_id(), $payload, 2 * MINUTE_IN_SECONDS);
        wp_safe_redirect(admin_url('admin.php?page=tg_taxid_guard'));
        exit;
    }
    public function handle_apply_preset(): void
    {
        if (! current_user_can('manage_woocommerce')) {
            wp_die(esc_html__('Insufficient permissions.', 'taxid-guard-for-woocommerce'));
        }

        check_admin_referer('tg_apply_preset', 'tg_apply_preset_nonce');

        $preset = sanitize_key((string) wp_unslash($_POST['preset'] ?? ''));
        switch ($preset) {
            case 'b2b_eu':
                update_option('tg_mode', 'validate');
                update_option('tg_show_company_checkbox', 'yes');
                update_option('tg_show_taxid_field', 'company');
                update_option('tg_company_requires_taxid', 'yes');
                update_option('tg_validate_es', 'yes');
                update_option('tg_validate_eu_vat', 'yes');
                update_option('tg_vat_prefix_auto', 'yes');
                break;
            case 'permissive':
                update_option('tg_mode', 'collect');
                update_option('tg_show_company_checkbox', 'yes');
                update_option('tg_show_taxid_field', 'always');
                update_option('tg_company_requires_taxid', 'no');
                update_option('tg_validate_es', 'yes');
                update_option('tg_validate_eu_vat', 'yes');
                update_option('tg_vat_prefix_auto', 'no');
                break;
            case 'es_only':
                update_option('tg_mode', 'validate');
                update_option('tg_show_company_checkbox', 'yes');
                update_option('tg_show_taxid_field', 'company');
                update_option('tg_company_requires_taxid', 'yes');
                update_option('tg_validate_es', 'yes');
                update_option('tg_validate_eu_vat', 'no');
                update_option('tg_required_countries', ['ES']);
                break;
            default:
                wp_safe_redirect(admin_url('admin.php?page=tg_taxid_guard'));
                exit;
        }

        wp_safe_redirect(admin_url('admin.php?page=tg_taxid_guard'));
        exit;
    }



    public function handle_export_settings(): void
    {
        if (! current_user_can('manage_woocommerce')) {
            wp_die(esc_html__('Insufficient permissions.', 'taxid-guard-for-woocommerce'));
        }

        check_admin_referer('tg_export_settings', 'tg_export_settings_nonce');

        $defaults = self::defaults();
        $payload = [];
        foreach ($defaults as $key => $default) {
            $payload[$key] = get_option($key, $default);
        }

        nocache_headers();
        header('Content-Type: application/json; charset=utf-8');
        header('Content-Disposition: attachment; filename="taxid-guard-settings-' . gmdate('Ymd-His') . '.json"');
        echo wp_json_encode($payload, JSON_PRETTY_PRINT);
        exit;
    }

    public function handle_import_settings(): void
    {
        if (! current_user_can('manage_woocommerce')) {
            wp_die(esc_html__('Insufficient permissions.', 'taxid-guard-for-woocommerce'));
        }

        check_admin_referer('tg_import_settings', 'tg_import_settings_nonce');

        if (empty($_FILES['tg_settings_json']['tmp_name']) || ! is_uploaded_file($_FILES['tg_settings_json']['tmp_name'])) {
            wp_safe_redirect(admin_url('admin.php?page=tg_taxid_guard'));
            exit;
        }

        $raw = file_get_contents($_FILES['tg_settings_json']['tmp_name']);
        $data = json_decode((string) $raw, true);
        if (! is_array($data)) {
            wp_safe_redirect(admin_url('admin.php?page=tg_taxid_guard'));
            exit;
        }

        foreach (self::defaults() as $key => $default) {
            if (array_key_exists($key, $data)) {
                update_option($key, $data[$key]);
            }
        }

        wp_safe_redirect(admin_url('admin.php?page=tg_taxid_guard'));
        exit;
    }

    public function handle_clear_vies_cache(): void
    {
        if (! current_user_can('manage_woocommerce')) {
            wp_die(esc_html__('Insufficient permissions.', 'taxid-guard-for-woocommerce'));
        }

        check_admin_referer('tg_clear_vies_cache', 'tg_clear_vies_cache_nonce');

        global $wpdb;
        if ($wpdb) {
            $prefixes = [
                '_transient_tg_vies_',
                '_transient_timeout_tg_vies_',
                '_transient_tg_pro_vies_',
                '_transient_timeout_tg_pro_vies_',
                '_transient_tg_pro_vies_fail_state',
                '_transient_tg_pro_vies_circuit_open',
                '_transient_timeout_tg_pro_vies_fail_state',
                '_transient_timeout_tg_pro_vies_circuit_open',
            ];
            foreach ($prefixes as $prefix) {
                $like = $wpdb->esc_like($prefix) . '%';
                $wpdb->query($wpdb->prepare("DELETE FROM {$wpdb->options} WHERE option_name LIKE %s", $like));
            }
        }

        wp_safe_redirect(admin_url('admin.php?page=tg_taxid_guard'));
        exit;
    }

    private function render_section_pro(bool $is_pro, string $upgrade_url): void
    {
        echo '<h2>' . esc_html__('Pro Features', 'taxid-guard-for-woocommerce') . '</h2>';
        echo '<p class="description">' . esc_html__('Unlock real-time VIES validation, advanced B2B rules, CSV exports and priority support.', 'taxid-guard-for-woocommerce') . '</p>';
        echo '<p><a class="button button-secondary" href="' . esc_url($upgrade_url) . '" target="_blank" rel="noopener">' . esc_html__('View Pro Plans', 'taxid-guard-for-woocommerce') . '</a></p>';
    }

    private function checkbox_row(string $key, string $label, string $description): void
    {
        echo '<tr><th>' . esc_html($label) . '</th><td><input type="hidden" name="' . esc_attr($key) . '" value="no" /><input type="checkbox" name="' . esc_attr($key) . '" value="yes" ' . checked('yes', (string) self::get($key), false) . ' />';
        if ($description !== '') {
            echo '<p class="description">' . esc_html($description) . '</p>';
        }
        echo '</td></tr>';
    }

    private function select_row(string $key, string $label, array $options, string $description): void
    {
        echo '<tr><th>' . esc_html($label) . '</th><td><select name="' . esc_attr($key) . '">';
        $current = (string) self::get($key);
        foreach ($options as $value => $text) {
            echo '<option value="' . esc_attr((string) $value) . '" ' . selected($current, (string) $value, false) . '>' . esc_html($text) . '</option>';
        }
        echo '</select>';
        if ($description !== '') {
            echo '<p class="description">' . esc_html($description) . '</p>';
        }
        echo '</td></tr>';
    }

    private function map_to_textarea($raw): string
    {
        if (! is_array($raw)) {
            return '';
        }
        $lines = [];
        foreach ($raw as $k => $v) {
            $key = strtoupper((string) $k);
            $val = str_replace("\n", '\\n', (string) $v);
            if (preg_match('/^[A-Z]{2}$/', $key) && $val !== '') {
                $lines[] = $key . '=' . $val;
            }
        }
        return implode("\n", $lines);
    }
}

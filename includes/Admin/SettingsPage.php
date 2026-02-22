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

            // Pro (safe defaults)
            'tg_pro_vies' => 'no',
            'tg_vies_cache_hours' => 24,
            'tg_vies_fail_mode' => 'block',
            'tg_required_roles' => [],
            'tg_cart_total_threshold' => 0.0,
            'tg_exclude_payment_methods' => [],
            'tg_exclude_shipping_methods' => [],
            'tg_exclude_virtual_orders' => 'no',
            'tg_email_customer' => 'no',
            'tg_mask_customer_email' => 'no',
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

        register_setting($group, 'tg_validate_es', ['sanitize_callback' => [$this, 'sanitize_yes_no']]);
        register_setting($group, 'tg_validate_eu_vat', ['sanitize_callback' => [$this, 'sanitize_yes_no']]);
        register_setting($group, 'tg_vat_prefix_auto', ['sanitize_callback' => [$this, 'sanitize_yes_no']]);
        register_setting($group, 'tg_required_countries', ['sanitize_callback' => [$this, 'sanitize_array_of_keys']]);

        register_setting($group, 'tg_taxid_label', ['sanitize_callback' => 'sanitize_text_field']);
        register_setting($group, 'tg_taxid_help', ['sanitize_callback' => 'sanitize_textarea_field']);
        register_setting($group, 'tg_label_by_country', ['sanitize_callback' => [$this, 'sanitize_assoc_map']]);
        register_setting($group, 'tg_help_by_country', ['sanitize_callback' => [$this, 'sanitize_assoc_map_help']]);

        // Pro-gated
        register_setting($group, 'tg_pro_vies', ['sanitize_callback' => fn($v) => $this->sanitize_pro_yes_no($v, 'no')]);
        register_setting($group, 'tg_vies_cache_hours', ['sanitize_callback' => fn($v) => $this->sanitize_pro_int_range($v, 1, 168, 24)]);
        register_setting($group, 'tg_vies_fail_mode', ['sanitize_callback' => fn($v) => $this->sanitize_pro_select($v, ['block', 'allow'], 'block')]);
        register_setting($group, 'tg_required_roles', ['sanitize_callback' => fn($v) => $this->sanitize_pro_array($v)]);
        register_setting($group, 'tg_cart_total_threshold', ['sanitize_callback' => fn($v) => $this->sanitize_pro_float($v, 0, 10000000, 0)]);
        register_setting($group, 'tg_exclude_payment_methods', ['sanitize_callback' => fn($v) => $this->sanitize_pro_array($v)]);
        register_setting($group, 'tg_exclude_shipping_methods', ['sanitize_callback' => fn($v) => $this->sanitize_pro_array($v)]);
        register_setting($group, 'tg_exclude_virtual_orders', ['sanitize_callback' => fn($v) => $this->sanitize_pro_yes_no($v, 'no')]);
        register_setting($group, 'tg_email_customer', ['sanitize_callback' => fn($v) => $this->sanitize_pro_yes_no($v, 'no')]);
        register_setting($group, 'tg_mask_customer_email', ['sanitize_callback' => fn($v) => $this->sanitize_pro_yes_no($v, 'no')]);
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

    public function sanitize_array_of_keys($v): array
    {
        $v = maybe_unserialize($v);
        if (is_string($v)) {
            $v = trim($v) === '' ? [] : preg_split('/\s*,\s*/', $v);
        }
        if (! is_array($v)) {
            $v = [];
        }

        $out = [];
        foreach ($v as $item) {
            $key = strtoupper(sanitize_text_field((string) $item));
            if ($key !== '') {
                $out[] = $key;
            }
        }
        return array_values(array_unique($out));
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

    public function sanitize_pro_yes_no($v, string $default): string
    {
        return $this->is_pro() ? $this->sanitize_yes_no($v) : $default;
    }

    public function sanitize_pro_int_range($v, int $min, int $max, int $default): int
    {
        return $this->is_pro() ? $this->sanitize_int_range($v, $min, $max, $default) : $default;
    }

    public function sanitize_pro_select($v, array $allowed, $default)
    {
        return $this->is_pro() ? $this->sanitize_select($v, $allowed, $default) : $default;
    }

    public function sanitize_pro_array($v): array
    {
        if (! $this->is_pro()) {
            return [];
        }
        return $this->sanitize_array_of_keys($v);
    }

    public function sanitize_pro_float($v, float $min, float $max, float $default): float
    {
        return $this->is_pro() ? $this->sanitize_float($v, $min, $max, $default) : $default;
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

        $is_pro = $this->is_pro();
        $fs = function_exists('tg_fs') ? tg_fs() : false;
        $upgrade_url = (! $is_pro && $fs && method_exists($fs, 'get_upgrade_url')) ? $fs->get_upgrade_url() : '';

        $label_map = $this->map_to_textarea(self::get('tg_label_by_country'));
        $help_map = $this->map_to_textarea(self::get('tg_help_by_country'));

        echo '<div class="wrap"><h1>' . esc_html__('TaxID Guard Settings', 'taxid-guard-for-woocommerce') . '</h1>';
        echo '<form method="post" action="options.php">';
        settings_fields('tg_taxid_guard');

        $this->render_section_general();
        $this->render_section_checkout();
        $this->render_section_validation();
        $this->render_section_countries($label_map, $help_map);
        $this->render_section_pro($is_pro, $upgrade_url);

        submit_button(__('Save changes', 'taxid-guard-for-woocommerce'));
        echo '</form></div>';
    }

    private function render_section_general(): void
    {
        echo '<h2>' . esc_html__('General', 'taxid-guard-for-woocommerce') . '</h2><table class="form-table">';
        $this->checkbox_row('tg_enable', __('Enable plugin', 'taxid-guard-for-woocommerce'), __('Master on/off switch.', 'taxid-guard-for-woocommerce'));
        $this->select_row('tg_mode', __('Mode', 'taxid-guard-for-woocommerce'), ['validate' => 'Validate (block)', 'collect' => 'Collect (no block)'], __('Validation behavior at checkout.', 'taxid-guard-for-woocommerce'));
        $this->checkbox_row('tg_debug', __('Debug logging', 'taxid-guard-for-woocommerce'), __('Write debug info to WooCommerce logs when enabled.', 'taxid-guard-for-woocommerce'));
        echo '</table>';
    }

    private function render_section_checkout(): void
    {
        echo '<h2>' . esc_html__('Checkout', 'taxid-guard-for-woocommerce') . '</h2><table class="form-table">';
        $this->checkbox_row('tg_show_company_checkbox', __('Show “I am a company” checkbox', 'taxid-guard-for-woocommerce'), '');
        $this->select_row('tg_show_taxid_field', __('Show Tax ID field', 'taxid-guard-for-woocommerce'), ['always' => 'Always', 'company' => 'Only for company', 'no' => 'No'], '');
        $this->checkbox_row('tg_company_requires_taxid', __('Tax ID required if company', 'taxid-guard-for-woocommerce'), '');
        $this->checkbox_row('tg_save_taxid_profile', __('Save to customer profile', 'taxid-guard-for-woocommerce'), '');
        $this->checkbox_row('tg_show_in_admin', __('Show in admin order', 'taxid-guard-for-woocommerce'), '');
        $this->checkbox_row('tg_email_admin', __('Show in admin emails', 'taxid-guard-for-woocommerce'), '');
        echo '</table>';
    }

    private function render_section_validation(): void
    {
        echo '<h2>' . esc_html__('Validation', 'taxid-guard-for-woocommerce') . '</h2><table class="form-table">';
        $this->checkbox_row('tg_validate_es', __('Validate ES (NIF/NIE/CIF)', 'taxid-guard-for-woocommerce'), '');
        $this->checkbox_row('tg_validate_eu_vat', __('Validate EU VAT pattern', 'taxid-guard-for-woocommerce'), '');
        $this->checkbox_row('tg_vat_prefix_auto', __('Auto prepend VAT country prefix', 'taxid-guard-for-woocommerce'), '');
        echo '<tr><th>' . esc_html__('Required countries (ISO2 CSV)', 'taxid-guard-for-woocommerce') . '</th><td><input class="regular-text" type="text" name="tg_required_countries" value="' . esc_attr(implode(',', (array) self::get('tg_required_countries'))) . '" placeholder="ES,IT,DE" /></td></tr>';
        echo '</table>';
    }

    private function render_section_countries(string $label_map, string $help_map): void
    {
        echo '<h2>' . esc_html__('Countries', 'taxid-guard-for-woocommerce') . '</h2><table class="form-table">';
        echo '<tr><th>' . esc_html__('Default label', 'taxid-guard-for-woocommerce') . '</th><td><input class="regular-text" type="text" name="tg_taxid_label" value="' . esc_attr((string) self::get('tg_taxid_label')) . '" /></td></tr>';
        echo '<tr><th>' . esc_html__('Default help', 'taxid-guard-for-woocommerce') . '</th><td><textarea class="large-text" rows="2" name="tg_taxid_help">' . esc_textarea((string) self::get('tg_taxid_help')) . '</textarea></td></tr>';
        echo '<tr><th>' . esc_html__('label_by_country', 'taxid-guard-for-woocommerce') . '</th><td><textarea class="large-text code" rows="6" name="tg_label_by_country" placeholder="ES=NIF/CIF\nIT=Partita IVA">' . esc_textarea($label_map) . '</textarea><p class="description">ISO2=Label per line.</p></td></tr>';
        echo '<tr><th>' . esc_html__('help_by_country', 'taxid-guard-for-woocommerce') . '</th><td><textarea class="large-text code" rows="6" name="tg_help_by_country" placeholder="ES=Introduce tu NIF/CIF\nIT=Inserisci partita IVA">' . esc_textarea($help_map) . '</textarea><p class="description">ISO2=Help per line. Use \\n for line break.</p></td></tr>';
        echo '</table>';
    }

    private function render_section_pro(bool $is_pro, string $upgrade_url): void
    {
        $disabled = $is_pro ? '' : ' disabled="disabled"';
        echo '<h2>' . esc_html__('Pro', 'taxid-guard-for-woocommerce') . '</h2>';
        if (! $is_pro) {
            echo '<p class="description">' . esc_html__('Available in Pro.', 'taxid-guard-for-woocommerce');
            if ($upgrade_url !== '') {
                echo ' <a class="button" href="' . esc_url($upgrade_url) . '">' . esc_html__('Upgrade', 'taxid-guard-for-woocommerce') . '</a>';
            }
            echo '</p>';
        }

        echo '<table class="form-table">';
        echo '<tr><th>Enable VIES validation</th><td><input type="hidden" name="tg_pro_vies" value="no" /><input type="checkbox" name="tg_pro_vies" value="yes" ' . checked('yes', (string) self::get('tg_pro_vies'), false) . $disabled . ' /></td></tr>';
        echo '<tr><th>VIES cache hours</th><td><input type="number" min="1" max="168" name="tg_vies_cache_hours" value="' . esc_attr((string) self::get('tg_vies_cache_hours')) . '"' . $disabled . ' /></td></tr>';
        echo '<tr><th>VIES fail mode</th><td><select name="tg_vies_fail_mode"' . $disabled . '><option value="block"' . selected('block', (string) self::get('tg_vies_fail_mode'), false) . '>block</option><option value="allow"' . selected('allow', (string) self::get('tg_vies_fail_mode'), false) . '>allow</option></select></td></tr>';
        echo '<tr><th>Required customer roles</th><td><input class="regular-text" type="text" name="tg_required_roles" value="' . esc_attr(implode(',', (array) self::get('tg_required_roles'))) . '"' . $disabled . ' /></td></tr>';
        echo '<tr><th>Min cart total</th><td><input type="text" name="tg_cart_total_threshold" value="' . esc_attr((string) self::get('tg_cart_total_threshold')) . '"' . $disabled . ' /></td></tr>';
        echo '<tr><th>Excluded payment methods</th><td><input class="regular-text" type="text" name="tg_exclude_payment_methods" value="' . esc_attr(implode(',', (array) self::get('tg_exclude_payment_methods'))) . '"' . $disabled . ' /></td></tr>';
        echo '<tr><th>Excluded shipping methods</th><td><input class="regular-text" type="text" name="tg_exclude_shipping_methods" value="' . esc_attr(implode(',', (array) self::get('tg_exclude_shipping_methods'))) . '"' . $disabled . ' /></td></tr>';
        echo '<tr><th>Exclude virtual orders</th><td><input type="hidden" name="tg_exclude_virtual_orders" value="no" /><input type="checkbox" name="tg_exclude_virtual_orders" value="yes" ' . checked('yes', (string) self::get('tg_exclude_virtual_orders'), false) . $disabled . ' /></td></tr>';
        echo '<tr><th>Email customer on invalid</th><td><input type="hidden" name="tg_email_customer" value="no" /><input type="checkbox" name="tg_email_customer" value="yes" ' . checked('yes', (string) self::get('tg_email_customer'), false) . $disabled . ' /></td></tr>';
        echo '<tr><th>Mask customer email</th><td><input type="hidden" name="tg_mask_customer_email" value="no" /><input type="checkbox" name="tg_mask_customer_email" value="yes" ' . checked('yes', (string) self::get('tg_mask_customer_email'), false) . $disabled . ' /></td></tr>';
        echo '</table>';
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

    private function is_pro(): bool
    {
        $fs = function_exists('tg_fs') ? tg_fs() : false;
        return $fs && method_exists($fs, 'is_paying') && $fs->is_paying();
    }
}

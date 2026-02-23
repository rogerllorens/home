=== TaxID Guard for WooCommerce ===
Contributors: rogix
Tags: woocommerce, vat, tax id, checkout blocks, b2b
Requires at least: 6.4
Tested up to: 6.6
Requires PHP: 8.0
Stable tag: 1.2.1
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Collect and validate Tax ID / VAT numbers in WooCommerce checkout (Classic + Checkout Blocks), with robust Lite controls and privacy-aware storage.

== Description ==
TaxID Guard helps stores collect business tax identifiers (VAT/NIF/CIF/NIE/EIN) with clean checkout UX and practical admin tools.

* Works with **Checkout Blocks** and Classic checkout.
* Country-aware labels/help and format validation.
* Optional automatic VAT prefix normalization.
* Admin visibility controls and masking.
* Location evidence capture for compliance workflows.

= Lite vs Pro =
| Capability | Lite | Pro |
| --- | --- | --- |
| Checkout field + local format validation | ✅ | ✅ |
| Classic + Checkout Blocks | ✅ | ✅ |
| VAT exemption modes | ✅ | ✅ advanced rules |
| Location evidence capture | ✅ | ✅ |
| VIES real-time validation | — | ✅ |
| Payment/Shipping VAT gating | — | ✅ |
| Readiness report + Pro exports | — | ✅ |

== Frequently Asked Questions ==
= Does this work with Checkout Blocks? =
Yes. The plugin supports WooCommerce Checkout Blocks and Classic checkout.

= Does Lite validate against VIES? =
No. VIES live validation is a Pro feature and requires SOAP on your server.

= Does this plugin support UK VAT / HMRC APIs? =
Lite focuses on robust collection/format validation and Woo-native flows. Pro can extend advanced B2B workflows.

= Is customer IP stored? =
Configurable. You can store no IP, hash only, or full IP for evidence workflows.

== Screenshots ==
1. Checkout field with company toggle and inline feedback.
2. Settings page with validation and privacy options.
3. Diagnostics and support tools.
4. Admin order display with Tax ID metadata.

== Changelog ==
= 1.2.1 =
* Hardening release focused on WP.org compliance, release tooling, migration safety, and privacy/security refinements.

jQuery(function ($) {
  var cfg = window.tgCheckout || {};
  var $checkbox = $('#tg_is_company, #billing_tg_is_company').first();
  var $taxInput = $('#tg_tax_id, #billing_tg_tax_id').first();
  var $taxField = $taxInput.closest('.form-row');

  if (!$checkbox.length || !$taxField.length || cfg.showTaxIdField !== 'company') {
    return;
  }

  function toggleTaxId() {
    var isCompany = $checkbox.is(':checked');
    $taxField.toggleClass('tg-tax-id-hidden', !isCompany);
    if (!isCompany) {
      $taxInput.val('');
    }
  }

  toggleTaxId();
  $checkbox.on('change', toggleTaxId);
});

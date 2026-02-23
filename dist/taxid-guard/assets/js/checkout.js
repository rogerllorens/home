jQuery(function ($) {
  var cfg = window.tgCheckout || {};
  var i18n = cfg.i18n || {};
  var $checkbox = $('#tg_is_company, #billing_tg_is_company').first();
  var $taxInput = $('#tg_tax_id, #billing_tg_tax_id').first();
  var $taxField = $taxInput.closest('.form-row');

  if (!$taxInput.length || !$taxField.length) {
    return;
  }

  var $hint = $('<p class="tg-tax-id-hint description" />');
  var $warn = $('<p class="tg-tax-id-warning description" />');
  $taxField.append($hint).append($warn);

  function isLikelyFormat(value) {
    var clean = String(value || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    return clean === '' || /^[A-Z0-9]{4,24}$/.test(clean);
  }

  function updateHint(isCompany) {
    if (cfg.showTaxIdField === 'company') {
      $hint.text(isCompany ? (i18n.hintCompany || 'Tax ID is required for company purchases.') : (i18n.hintIndividual || 'Only required if you are a company.'));
    } else {
      $hint.text(i18n.hintGeneric || 'Provide your Tax ID if applicable.');
    }
  }

  function updateWarn() {
    if (isLikelyFormat($taxInput.val())) {
      $warn.text('');
      return;
    }
    $warn.text(i18n.warnFormat || 'Tax ID format looks unusual. Please double-check.');
  }

  function toggleTaxId() {
    if (!$checkbox.length || cfg.showTaxIdField !== 'company') {
      updateHint(true);
      updateWarn();
      return;
    }

    var isCompany = $checkbox.is(':checked');
    $taxField.toggleClass('tg-tax-id-hidden', !isCompany);
    updateHint(isCompany);
    if (!isCompany) {
      $taxInput.val('');
      $warn.text('');
    }
  }

  toggleTaxId();
  if ($checkbox.length) {
    $checkbox.on('change', toggleTaxId);
  }
  $taxInput.on('input blur', updateWarn);
});

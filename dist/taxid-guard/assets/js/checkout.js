jQuery(function ($) {
  var cfg = window.tgCheckout || {};
  var i18n = cfg.i18n || {};

  var $checkbox = $('#tg_is_company, #billing_tg_is_company').first();
  var $taxInput = $('#tg_tax_id, #billing_tg_tax_id').first();
  var $taxField = $taxInput.closest('.form-row');
  var $companyInput = $('#billing_company, #company').first();
  var $country = $('#billing_country').first();

  if (!$taxInput.length || !$taxField.length) {
    return;
  }

  var $hint = $('<p class="tg-tax-id-hint description" />');
  var $status = $('<p class="tg-tax-id-status description" />');
  var $warn = $('<p class="tg-tax-id-warning description" />');
  var $normalized = $('<p class="tg-tax-id-normalized description" />');
  $taxField.append($hint).append($status).append($warn).append($normalized);

  function cleanValue(value) {
    return String(value || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  }

  function isLikelyFormat(value) {
    var clean = cleanValue(value);
    return clean === '' || /^[A-Z0-9]{4,24}$/.test(clean);
  }

  function isLikelyEs(value) {
    var clean = cleanValue(value);
    if (clean === '') return true;
    return /^[0-9]{8}[A-Z]$/.test(clean) || /^[XYZ][0-9]{7}[A-Z]$/.test(clean) || /^[ABCDEFGHJNPQRSUVW][0-9]{7}[0-9A-J]$/.test(clean);
  }

  function normalizePreview() {
    var raw = String($taxInput.val() || '');
    var clean = cleanValue(raw);
    var country = String(($country.val() || '')).toUpperCase();
    if (cfg.vatPrefixAuto && country && clean && country !== 'ES' && !new RegExp('^' + country).test(clean)) {
      clean = country + clean;
      $warn.text(i18n.autoPrefixApplied || 'Country prefix will be applied automatically.');
    }
    if (!clean) {
      $normalized.text('');
      return;
    }
    var tpl = i18n.normalizedAs || 'We will store it as: %s';
    $normalized.text(tpl.replace('%s', clean));
  }

  function updateCountryUi() {
    var c = String(($country.val() || '')).toUpperCase();
    var labelByCountry = cfg.labelByCountry || {};
    var helpByCountry = cfg.helpByCountry || {};
    var label = labelByCountry[c] || cfg.defaultLabel;
    var help = helpByCountry[c] || cfg.defaultHelp;

    var $label = $('label[for="tg_tax_id"], label[for="billing_tg_tax_id"]').first();
    if ($label.length && label) {
      $label.text(label);
    }
    if (help) {
      $hint.text(help);
    }
    $taxInput.attr('placeholder', c === 'ES' ? '12345678Z' : (c ? (c + '123456789') : ''));
  }

  function updateStatus() {
    var val = String($taxInput.val() || '');
    var clean = cleanValue(val);
    var c = String(($country.val() || '')).toUpperCase();
    $status.removeClass('tg-state-good tg-state-bad tg-state-neutral');

    if (!clean) {
      $status.addClass('tg-state-neutral').text('');
      $warn.text('');
      return;
    }

    if (c === 'ES') {
      if (isLikelyEs(clean)) {
        $status.addClass('tg-state-good').text(i18n.looksGoodEs || 'Looks like a valid Spanish tax ID format.');
        $warn.text('');
      } else {
        $status.addClass('tg-state-bad').text(i18n.looksWrongEs || 'Unrecognized format for Spain (NIF/CIF/NIE).');
        $warn.text(i18n.ifIndividual || 'If you are an individual, uncheck “I am a company”.');
      }
      return;
    }

    if (isLikelyFormat(clean)) {
      $status.addClass('tg-state-good').text(i18n.looksGood || 'Format looks good.');
      $warn.text('');
    } else {
      $status.addClass('tg-state-bad').text(i18n.warnFormat || 'Tax ID format looks unusual. Please double-check.');
    }
  }

  function updateHint(isCompany) {
    if (cfg.showTaxIdField === 'company') {
      if (isCompany) {
        $hint.text(i18n.hintCompany || 'Tax ID is required for company purchases.');
      } else {
        $hint.text(i18n.hintEnableCompany || 'Enable “I am a company” to enter VAT.');
      }
      return;
    }
    $hint.text(i18n.hintGeneric || 'Provide your Tax ID if applicable.');
  }

  function autoDetectCompany() {
    if (!$checkbox.length) {
      return;
    }
    var hasCompanyName = $companyInput.length && String($companyInput.val() || '').trim() !== '';
    var c = String(($country.val() || '')).toUpperCase();
    var clean = cleanValue($taxInput.val());
    var hasVatPrefix = !!(c && clean.indexOf(c) === 0);
    if ((hasCompanyName || hasVatPrefix) && !$checkbox.is(':checked')) {
      $checkbox.prop('checked', true).trigger('change');
    }
  }

  function toggleTaxId() {
    if (!$checkbox.length || cfg.showTaxIdField !== 'company') {
      updateHint(true);
      updateStatus();
      normalizePreview();
      return;
    }

    var isCompany = $checkbox.is(':checked');
    $taxField.toggleClass('tg-tax-id-disabled', !isCompany);
    $taxInput.prop('disabled', !isCompany);
    updateHint(isCompany);

    if (!isCompany) {
      $warn.text('');
      $status.removeClass('tg-state-good tg-state-bad').addClass('tg-state-neutral').text('');
      $normalized.text('');
      return;
    }

    updateStatus();
    normalizePreview();
  }

  function focusFieldOnServerError() {
    if (!$('.woocommerce-error, .woocommerce-NoticeGroup-checkout .woocommerce-error').length) {
      return;
    }
    if (!$taxInput.length) {
      return;
    }
    $taxInput.trigger('focus');
    $('html, body').animate({ scrollTop: Math.max(0, $taxField.offset().top - 120) }, 250);
  }

  updateCountryUi();
  autoDetectCompany();
  toggleTaxId();
  focusFieldOnServerError();

  if ($checkbox.length) {
    $checkbox.on('change', toggleTaxId);
  }
  if ($companyInput.length) {
    $companyInput.on('input blur', function () {
      autoDetectCompany();
    });
  }
  if ($country.length) {
    $country.on('change', function () {
      updateCountryUi();
      autoDetectCompany();
      toggleTaxId();
    });
  }

  $taxInput.on('input blur', function () {
    autoDetectCompany();
    updateStatus();
    normalizePreview();
  });
});

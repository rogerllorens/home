jQuery( function( $ ) {
    var $checkbox = $( '#tg_is_company, #billing_tg_is_company' ).first();
    var $taxInput = $( '#tg_tax_id, #billing_tg_tax_id' ).first();
    var $taxField = $taxInput.closest( '.form-row' );

    if ( !$checkbox.length || !$taxField.length ) {
        return;
    }

    function toggle() {
        if ( $checkbox.is( ':checked' ) ) {
            $taxField.removeClass( 'tg-tax-id-hidden' );
        } else {
            $taxField.addClass( 'tg-tax-id-hidden' );
        }
    }

    toggle();
    $checkbox.on( 'change', toggle );
} );

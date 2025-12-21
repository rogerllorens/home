<?php

namespace App\Services\Embeds;

use Mews\Purifier\Facades\Purifier;

class EmbedSanitizer
{
    public function sanitize(string $html): string
    {
        return (string) Purifier::clean($html, [
            'HTML.Allowed' => 'iframe[src|width|height|allowfullscreen|frameborder|allow]',
            'Attr.EnableID' => false,
            'CSS.AllowedProperties' => [],
            'AutoFormat.RemoveEmpty' => true,
            'URI.AllowedSchemes' => ['https' => true],
        ]);
    }
}

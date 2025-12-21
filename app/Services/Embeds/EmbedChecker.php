<?php

namespace App\Services\Embeds;

use GuzzleHttp\Client;

class EmbedChecker
{
    public function __construct(private readonly Client $client)
    {
    }

    public function check(string $url, int $timeoutSeconds): bool
    {
        if (trim($url) === '') {
            return false;
        }

        $options = [
            'timeout' => $timeoutSeconds,
            'http_errors' => false,
        ];

        try {
            $response = $this->client->head($url, $options);
            $status = $response->getStatusCode();

            if (in_array($status, [403, 405], true)) {
                $response = $this->client->get($url, $options + [
                    'headers' => [
                        'Range' => 'bytes=0-1024',
                    ],
                ]);
                $status = $response->getStatusCode();
            }

            return $status >= 200 && $status < 400;
        } catch (\Throwable) {
            return false;
        }
    }
}

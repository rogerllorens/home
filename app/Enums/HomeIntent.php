<?php

namespace App\Enums;

enum HomeIntent: string
{
    case Quick = 'quick';
    case Explore = 'explore';
    case Usual = 'usual';
    case Soft = 'soft';

    public static function options(): array
    {
        return [
            self::Quick->value,
            self::Explore->value,
            self::Usual->value,
            self::Soft->value,
        ];
    }

    public static function normalize(?string $value): ?self
    {
        if (!$value) {
            return null;
        }

        foreach (self::cases() as $case) {
            if ($case->value === $value) {
                return $case;
            }
        }

        return null;
    }
}

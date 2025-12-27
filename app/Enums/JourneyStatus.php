<?php

namespace App\Enums;

enum JourneyStatus: string
{
    case Draft = 'draft';
    case Published = 'published';
}

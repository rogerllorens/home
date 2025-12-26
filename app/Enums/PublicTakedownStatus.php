<?php

namespace App\Enums;

enum PublicTakedownStatus: string
{
    case Received = 'received';
    case InReview = 'in_review';
    case Resolved = 'resolved';
}

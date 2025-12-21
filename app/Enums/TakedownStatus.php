<?php

namespace App\Enums;

enum TakedownStatus: string
{
    case Pending = 'pending';
    case Approved = 'approved';
    case Rejected = 'rejected';
    case Removed = 'removed';
}

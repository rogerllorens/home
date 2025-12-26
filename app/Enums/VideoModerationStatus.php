<?php

namespace App\Enums;

enum VideoModerationStatus: string
{
    case PendingReview = 'pending_review';
    case Approved = 'approved';
    case Rejected = 'rejected';
    case RemovedByRequest = 'removed_by_request';
}
